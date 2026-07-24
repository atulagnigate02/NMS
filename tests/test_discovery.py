import socket
import unittest
from unittest.mock import MagicMock, patch

from backend.services import discovery


class DiscoveryTests(unittest.TestCase):
    def test_iter_hosts(self):
        self.assertEqual(discovery.iter_hosts("192.168.10.0/30", 10), ["192.168.10.1", "192.168.10.2"])
        self.assertEqual(discovery.iter_hosts("192.168.10.0/24", 2), ["192.168.10.1", "192.168.10.2"])

    @patch("backend.services.discovery.subprocess.run")
    def test_ping_host(self, run):
        run.return_value.returncode = 0
        with patch("backend.services.discovery.platform.system", return_value="Windows"):
            self.assertTrue(discovery.ping_host("127.0.0.1", 500))
        self.assertEqual(run.call_args.args[0][:3], ["ping", "-n", "1"])
        run.return_value.returncode = 1
        with patch("backend.services.discovery.platform.system", return_value="Windows"):
            self.assertFalse(discovery.ping_host("192.0.2.1", 500))

    @patch("backend.services.discovery.socket.create_connection")
    def test_scan_port_and_scan_ports(self, create_connection):
        create_connection.return_value.__enter__.return_value = MagicMock()
        self.assertTrue(discovery.scan_port("127.0.0.1", 8000, 100))
        create_connection.side_effect = OSError
        self.assertFalse(discovery.scan_port("127.0.0.1", 1, 100))
        with patch("backend.services.discovery.scan_port", side_effect=[True, False, True]) as scan:
            self.assertEqual(discovery.scan_ports("127.0.0.1", [22, 80, 443], 100), [22, 443])
            self.assertEqual(scan.call_count, 3)

    @patch("backend.services.discovery.subprocess.run")
    def test_resolve_hostname_and_mac_address(self, run):
        with patch("backend.services.discovery.socket.gethostbyaddr", return_value=("router.example", [], [])):
            self.assertEqual(discovery.resolve_hostname("192.168.1.1"), "router.example")
        with patch("backend.services.discovery.socket.gethostbyaddr", side_effect=socket.herror):
            self.assertIsNone(discovery.resolve_hostname("192.0.2.1"))

        run.return_value.returncode = 0
        run.return_value.stdout = "Interface: 192.168.1.10 --- 0x7\n  192.168.1.1  aa-bb-cc-dd-ee-ff  dynamic\n"
        self.assertEqual(discovery.get_mac_address("192.168.1.1"), "aa:bb:cc:dd:ee:ff")
        run.return_value.stdout = ""
        self.assertIsNone(discovery.get_mac_address("192.0.2.1"))

    def test_ber_helpers_and_snmp_packet(self):
        self.assertEqual(discovery._ber_length(10), b"\x0a")
        self.assertTrue(discovery._ber_length(130).startswith(b"\x81"))
        integer = discovery._ber_integer(128)
        self.assertEqual(integer[:2], b"\x02\x02")
        self.assertEqual(discovery._ber_octet_string("public"), b"\x04\x06public")
        self.assertEqual(discovery._ber_null(), b"\x05\x00")
        oid = discovery._ber_oid("1.3.6.1.2.1.1.5.0")
        self.assertEqual(oid[0], 0x06)
        packet = discovery._build_snmp_get("public", discovery.SYS_NAME_OID, 1001)
        self.assertEqual(packet[0], 0x30)
        tag, value, end = discovery._read_tlv(packet, 0)
        self.assertEqual(tag, 0x30)
        self.assertEqual(end, len(packet))
        self.assertIsNone(discovery._extract_first_octet_string(value))
        self.assertEqual(discovery._extract_first_octet_string(discovery._ber_octet_string("router-01")), "router-01")

    @patch("backend.services.discovery.socket.socket")
    def test_snmp_get(self, socket_class):
        sock = socket_class.return_value.__enter__.return_value
        sock.recvfrom.return_value = (b"\x30\x0b\x04\x09router-01", ("192.168.1.1", 161))
        self.assertEqual(discovery.snmp_get("192.168.1.1", "public", discovery.SYS_NAME_OID, 100), "router-01")
        sock.recvfrom.side_effect = OSError
        self.assertIsNone(discovery.snmp_get("192.0.2.1", "public", discovery.SYS_NAME_OID, 100))

    @patch("backend.services.discovery.get_mac_address", return_value="aa:bb:cc:dd:ee:ff")
    @patch("backend.services.discovery.resolve_hostname", return_value="router-01")
    @patch("backend.services.discovery.snmp_get", side_effect=["router-snmp", "Linux router"])
    @patch("backend.services.discovery.scan_ports", return_value=[22, 161])
    @patch("backend.services.discovery.ping_host", return_value=True)
    def test_discover_host(self, ping, ports, snmp, hostname, mac):
        result = discovery.discover_host("192.168.1.1", [22, 161], 500, "public", True, True, True)
        self.assertEqual(result.ip_address, "192.168.1.1")
        self.assertTrue(result.is_alive)
        self.assertEqual(result.open_ports, [22, 161])
        self.assertEqual(result.hostname, "router-01")
        self.assertEqual(result.mac_address, "aa:bb:cc:dd:ee:ff")
        self.assertEqual(result.snmp_name, "router-snmp")
        self.assertEqual(result.snmp_description, "Linux router")

    @patch("backend.services.discovery.discover_host")
    @patch("backend.services.discovery.iter_hosts", return_value=["192.168.1.2", "192.168.1.1"])
    def test_discover_network_filters_and_sorts(self, hosts, discover_host):
        discover_host.side_effect = [
            discovery.DiscoveryResult("192.168.1.2", False, [], "host-2", "aa:bb:cc:dd:ee:02", None, None),
            discovery.DiscoveryResult("192.168.1.1", True, [], "host-1", None, None, None),
        ]
        results = discovery.discover_network("192.168.1.0/24", [], 100, "public", True, False, False, 2)
        self.assertEqual([result.ip_address for result in results], ["192.168.1.1", "192.168.1.2"])
        self.assertEqual(discover_host.call_count, 2)


if __name__ == "__main__":
    unittest.main()
