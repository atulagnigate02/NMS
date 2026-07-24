import ipaddress
import platform
import re
import socket
import struct
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass


DEFAULT_PORTS = [22, 80, 443, 161, 162, 8080, 8443]
SYS_DESCR_OID = "1.3.6.1.2.1.1.1.0"
SYS_NAME_OID = "1.3.6.1.2.1.1.5.0"


@dataclass
class DiscoveryResult:
    ip_address: str
    is_alive: bool
    open_ports: list[int]
    snmp_name: str | None
    snmp_description: str | None
    mac_address: str | None = None
    hostname: str | None = None


def iter_hosts(network_range: str, max_hosts: int) -> list[str]:
    network = ipaddress.ip_network(network_range, strict=False)
    return [str(host) for host in list(network.hosts())[:max_hosts]]


def ping_host(ip_address: str, timeout_ms: int) -> bool:
    system = platform.system().lower()
    if system == "windows":
        command = ["ping", "-n", "1", "-w", str(timeout_ms), ip_address]
    else:
        command = ["ping", "-c", "1", "-W", str(max(1, timeout_ms // 1000)), ip_address]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=(timeout_ms / 1000) + 1)
    except (subprocess.SubprocessError, OSError):
        return False
    return result.returncode == 0


def scan_port(ip_address: str, port: int, timeout_ms: int) -> bool:
    try:
        with socket.create_connection((ip_address, port), timeout=timeout_ms / 1000):
            return True
    except OSError:
        return False


def scan_ports(ip_address: str, ports: list[int], timeout_ms: int) -> list[int]:
    open_ports: list[int] = []
    for port in ports:
        if scan_port(ip_address, port, timeout_ms):
            open_ports.append(port)
    return open_ports


def build_arp_lookup() -> dict[str, str]:
    try:
        result = subprocess.run(["arp", "-a"], capture_output=True, text=True, check=False)
    except (OSError, subprocess.SubprocessError):
        return {}

    arp_lookup: dict[str, str] = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line or "Physical Address" in line or "Internet Address" in line:
            continue
        match = re.search(r"(\d+\.\d+\.\d+\.\d+)", line)
        mac_match = re.search(r"([0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2})", line)
        if not match or not mac_match:
            continue
        ip_address = match.group(1)
        mac_address = mac_match.group(1).replace("-", ":").upper()
        arp_lookup[ip_address] = mac_address
    return arp_lookup


def resolve_hostname(ip_address: str) -> str | None:
    try:
        host_info = socket.gethostbyaddr(ip_address)
    except OSError:
        return None
    return host_info[0].split(".")[0] if host_info and host_info[0] else None


def _ber_length(length: int) -> bytes:
    if length < 128:
        return bytes([length])
    encoded = length.to_bytes((length.bit_length() + 7) // 8, "big")
    return bytes([0x80 | len(encoded)]) + encoded


def _ber_tlv(tag: int, value: bytes) -> bytes:
    return bytes([tag]) + _ber_length(len(value)) + value


def _ber_integer(value: int) -> bytes:
    if value == 0:
        return _ber_tlv(0x02, b"\x00")
    encoded = value.to_bytes((value.bit_length() + 7) // 8, "big")
    if encoded[0] & 0x80:
        encoded = b"\x00" + encoded
    return _ber_tlv(0x02, encoded)


def _ber_octet_string(value: str) -> bytes:
    return _ber_tlv(0x04, value.encode())


def _ber_null() -> bytes:
    return _ber_tlv(0x05, b"")


def _ber_oid(oid: str) -> bytes:
    parts = [int(part) for part in oid.split(".")]
    encoded = bytes([parts[0] * 40 + parts[1]])
    for part in parts[2:]:
        stack = [part & 0x7F]
        part >>= 7
        while part:
            stack.append(0x80 | (part & 0x7F))
            part >>= 7
        encoded += bytes(reversed(stack))
    return _ber_tlv(0x06, encoded)


def _build_snmp_get(community: str, oid: str, request_id: int) -> bytes:
    varbind = _ber_tlv(0x30, _ber_oid(oid) + _ber_null())
    varbind_list = _ber_tlv(0x30, varbind)
    pdu = _ber_tlv(0xA0, _ber_integer(request_id) + _ber_integer(0) + _ber_integer(0) + varbind_list)
    return _ber_tlv(0x30, _ber_integer(1) + _ber_octet_string(community) + pdu)


def _read_length(data: bytes, offset: int) -> tuple[int, int]:
    first = data[offset]
    offset += 1
    if first < 128:
        return first, offset
    size = first & 0x7F
    return int.from_bytes(data[offset : offset + size], "big"), offset + size


def _read_tlv(data: bytes, offset: int) -> tuple[int, bytes, int]:
    tag = data[offset]
    length, value_offset = _read_length(data, offset + 1)
    end = value_offset + length
    return tag, data[value_offset:end], end


def _extract_first_octet_string(data: bytes) -> str | None:
    offset = 0
    while offset < len(data):
        try:
            tag, value, next_offset = _read_tlv(data, offset)
        except (IndexError, ValueError):
            return None
        if tag == 0x04:
            try:
                decoded = value.decode(errors="ignore").strip()
            except UnicodeDecodeError:
                decoded = ""
            if decoded and decoded != "public":
                return decoded
        nested = _extract_first_octet_string(value) if tag in {0x30, 0xA2} else None
        if nested:
            return nested
        offset = next_offset
    return None


def snmp_get(ip_address: str, community: str, oid: str, timeout_ms: int) -> str | None:
    packet = _build_snmp_get(community, oid, request_id=1001)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(timeout_ms / 1000)
            sock.sendto(packet, (ip_address, 161))
            data, _ = sock.recvfrom(4096)
    except OSError:
        return None
    return _extract_first_octet_string(data)


def discover_host(
    ip_address: str,
    ports: list[int],
    timeout_ms: int,
    snmp_community: str,
    scan_icmp: bool,
    scan_tcp_ports: bool,
    scan_snmp: bool,
    mac_address: str | None = None,
) -> DiscoveryResult:
    is_alive = ping_host(ip_address, timeout_ms) if scan_icmp else False
    open_ports = scan_ports(ip_address, ports, timeout_ms) if scan_tcp_ports else []
    snmp_name = None
    snmp_description = None
    hostname = resolve_hostname(ip_address)
    if scan_snmp:
        snmp_name = snmp_get(ip_address, snmp_community, SYS_NAME_OID, timeout_ms)
        snmp_description = snmp_get(ip_address, snmp_community, SYS_DESCR_OID, timeout_ms)

    if open_ports:
        is_alive = True
    if snmp_name or snmp_description:
        is_alive = True

    return DiscoveryResult(
        ip_address=ip_address,
        is_alive=is_alive,
        open_ports=open_ports,
        snmp_name=snmp_name,
        snmp_description=snmp_description,
        mac_address=mac_address,
        hostname=hostname,
    )


def discover_network(
    network_range: str,
    ports: list[int],
    timeout_ms: int,
    snmp_community: str,
    scan_icmp: bool,
    scan_tcp_ports: bool,
    scan_snmp: bool,
    max_hosts: int,
) -> list[DiscoveryResult]:
    hosts = iter_hosts(network_range, max_hosts)
    arp_lookup = build_arp_lookup()
    results: list[DiscoveryResult] = []
    workers = min(64, max(1, len(hosts)))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [
            executor.submit(
                discover_host,
                host,
                ports,
                timeout_ms,
                snmp_community,
                scan_icmp,
                scan_tcp_ports,
                scan_snmp,
                arp_lookup.get(host),
            )
            for host in hosts
        ]
        for future in as_completed(futures):
            result = future.result()
            if result.is_alive or result.open_ports or result.snmp_name or result.snmp_description:
                results.append(result)
    return sorted(results, key=lambda item: ipaddress.ip_address(item.ip_address))
