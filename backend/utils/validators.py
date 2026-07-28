import re
from ipaddress import ip_address, IPv4Address, IPv6Address, AddressValueError
from typing import Optional


def validate_email(email: str) -> tuple[bool, Optional[str]]:
    """
    Validate email address format.
    Returns (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "Invalid email format"
    
    if len(email) > 255:
        return False, "Email must be less than 255 characters"
    
    return True, None


def validate_password(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.
    Returns (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    # Check for at least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    # Check for at least one digit
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def validate_ip_address(ip: str) -> tuple[bool, Optional[str]]:
    """
    Validate IPv4 or IPv6 address.
    Returns (is_valid, error_message)
    """
    if not ip:
        return False, "IP address is required"
    
    try:
        ip_address(ip)
    except AddressValueError:
        return False, "Invalid IP address format"
    
    return True, None


def validate_mac_address(mac: str) -> tuple[bool, Optional[str]]:
    """
    Validate MAC address format.
    Returns (is_valid, error_message)
    """
    if not mac:
        return True, None  # MAC address is optional
    
    mac_pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
    if not re.match(mac_pattern, mac):
        return False, "Invalid MAC address format (expected: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)"
    
    return True, None


def validate_port(port: int) -> tuple[bool, Optional[str]]:
    """
    Validate port number.
    Returns (is_valid, error_message)
    """
    if not isinstance(port, int):
        return False, "Port must be a number"
    
    if port < 1 or port > 65535:
        return False, "Port must be between 1 and 65535"
    
    return True, None


def validate_url(url: str) -> tuple[bool, Optional[str]]:
    """
    Validate URL format.
    Returns (is_valid, error_message)
    """
    if not url:
        return True, None  # URL is optional
    
    url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(url_pattern, url):
        return False, "Invalid URL format (must start with http:// or https://)"
    
    return True, None


def validate_hostname(hostname: str) -> tuple[bool, Optional[str]]:
    """
    Validate hostname format.
    Returns (is_valid, error_message)
    """
    if not hostname:
        return False, "Hostname is required"
    
    if len(hostname) > 253:
        return False, "Hostname must be less than 253 characters"
    
    # Check for valid hostname characters
    hostname_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
    if not re.match(hostname_pattern, hostname):
        return False, "Invalid hostname format"
    
    return True, None


def validate_latitude(latitude: float) -> tuple[bool, Optional[str]]:
    """
    Validate latitude coordinate.
    Returns (is_valid, error_message)
    """
    if latitude is None:
        return True, None  # Latitude is optional
    
    if not isinstance(latitude, (int, float)):
        return False, "Latitude must be a number"
    
    if latitude < -90 or latitude > 90:
        return False, "Latitude must be between -90 and 90"
    
    return True, None


def validate_longitude(longitude: float) -> tuple[bool, Optional[str]]:
    """
    Validate longitude coordinate.
    Returns (is_valid, error_message)
    """
    if longitude is None:
        return True, None  # Longitude is optional
    
    if not isinstance(longitude, (int, float)):
        return False, "Longitude must be a number"
    
    if longitude < -180 or longitude > 180:
        return False, "Longitude must be between -180 and 180"
    
    return True, None


def validate_positive_number(value: float, field_name: str = "Value") -> tuple[bool, Optional[str]]:
    """
    Validate that a number is positive.
    Returns (is_valid, error_message)
    """
    if value is None:
        return True, None  # Optional field
    
    if not isinstance(value, (int, float)):
        return False, f"{field_name} must be a number"
    
    if value < 0:
        return False, f"{field_name} must be positive"
    
    return True, None


def validate_percentage(value: float, field_name: str = "Value") -> tuple[bool, Optional[str]]:
    """
    Validate that a number is between 0 and 100.
    Returns (is_valid, error_message)
    """
    if value is None:
        return True, None  # Optional field
    
    if not isinstance(value, (int, float)):
        return False, f"{field_name} must be a number"
    
    if value < 0 or value > 100:
        return False, f"{field_name} must be between 0 and 100"
    
    return True, None


def validate_string_length(value: str, min_length: int = 1, max_length: int = 255, field_name: str = "Field") -> tuple[bool, Optional[str]]:
    """
    Validate string length.
    Returns (is_valid, error_message)
    """
    if value is None:
        return True, None  # Optional field
    
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    if len(value) < min_length:
        return False, f"{field_name} must be at least {min_length} characters"
    
    if len(value) > max_length:
        return False, f"{field_name} must be less than {max_length} characters"
    
    return True, None


def validate_snmp_version(version: str) -> tuple[bool, Optional[str]]:
    """
    Validate SNMP version.
    Returns (is_valid, error_message)
    """
    if version is None:
        return True, None  # Optional field
    
    valid_versions = ["v1", "v2c", "v3"]
    if version.lower() not in valid_versions:
        return False, f"SNMP version must be one of: {', '.join(valid_versions)}"
    
    return True, None
