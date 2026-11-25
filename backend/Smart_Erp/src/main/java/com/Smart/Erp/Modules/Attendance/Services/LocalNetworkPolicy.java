package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Enforces strict LAN-only IP validation, private classroom CIDR allowlisting,
 * and anti-proxy/forwarding header checks for local attendance handshakes.
 */
@Service
public class LocalNetworkPolicy {

    private static final Pattern IPV4_LITERAL = Pattern.compile(
            "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$"
    );
    private static final Pattern IPV6_LITERAL = Pattern.compile("^[0-9a-fA-F:]+$");

    private static final Set<String> FORBIDDEN_PROXY_HEADERS = Set.of(
            "x-forwarded-for",
            "x-forwarded-host",
            "x-forwarded-proto",
            "x-forwarded-port",
            "forwarded",
            "via",
            "x-real-ip",
            "cf-connecting-ip",
            "true-client-ip",
            "proxy-client-ip",
            "wl-proxy-client-ip"
    );

    public boolean isValidIpLiteral(String rawIp) {
        if (rawIp == null) {
            return false;
        }
        String ip = normalizeIp(rawIp);
        if (ip.isEmpty()) {
            return false;
        }
        return IPV4_LITERAL.matcher(ip).matches() || (ip.contains(":") && IPV6_LITERAL.matcher(ip).matches());
    }

    public String normalizeIp(String rawIp) {
        if (rawIp == null) {
            return "";
        }
        String trimmed = rawIp.trim();
        int zoneIdx = trimmed.indexOf('%');
        if (zoneIdx > 0) {
            trimmed = trimmed.substring(0, zoneIdx);
        }
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.startsWith("::ffff:")) {
            String mapped = trimmed.substring(7);
            if (IPV4_LITERAL.matcher(mapped).matches()) {
                return mapped;
            }
        }
        return trimmed;
    }

    /**
     * Checks whether the address belongs strictly to RFC 1918 private IPv4 LAN space
     * (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) or IPv6 Unique Local Address (fc00::/7).
     * Rejects public/internet IPs, loopback, unspecified (0.0.0.0), link-local, and multicast.
     */
    public boolean isPrivateLanIp(String rawIp) {
        String ip = normalizeIp(rawIp);
        if (!isValidIpLiteral(ip)) {
            return false;
        }
        try {
            InetAddress addr = InetAddress.getByName(ip);
            if (addr.isAnyLocalAddress()
                    || addr.isLoopbackAddress()
                    || addr.isLinkLocalAddress()
                    || addr.isMulticastAddress()) {
                return false;
            }
            if (addr instanceof Inet4Address) {
                byte[] b = addr.getAddress();
                int b0 = b[0] & 0xFF;
                int b1 = b[1] & 0xFF;
                if (b0 == 10) {
                    return true;
                }
                if (b0 == 172 && b1 >= 16 && b1 <= 31) {
                    return true;
                }
                if (b0 == 192 && b1 == 168) {
                    return true;
                }
                return false;
            }
            if (addr instanceof Inet6Address) {
                byte[] b = addr.getAddress();
                int b0 = b[0] & 0xFE;
                return b0 == 0xFC;
            }
            return false;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    public String deriveDefaultCidr(String lanIp) {
        String ip = normalizeIp(lanIp);
        if (!isPrivateLanIp(ip)) {
            throw new OperationNotAllowedException("Teacher companion IP must be a valid private LAN address (RFC 1918 or IPv6 ULA): " + lanIp);
        }
        if (IPV4_LITERAL.matcher(ip).matches()) {
            String[] parts = ip.split("\\.");
            return parts[0] + "." + parts[1] + "." + parts[2] + ".0/24";
        }
        try {
            byte[] b = InetAddress.getByName(ip).getAddress();
            return String.format("%02x%02x:%02x%02x:%02x%02x:%02x%02x::/64",
                    b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]);
        } catch (UnknownHostException e) {
            throw new OperationNotAllowedException("Invalid LAN IP for CIDR derivation: " + lanIp);
        }
    }

    /**
     * Parses, validates, and normalizes allowed classroom subnets.
     * Every CIDR must sit inside private LAN address space and include the teacher's LAN IP.
     */
    public List<String> normalizeAndValidateSubnets(String rawSubnetsCsv, String teacherLanIp) {
        String cleanTeacherIp = normalizeIp(teacherLanIp);
        if (!isPrivateLanIp(cleanTeacherIp)) {
            throw new OperationNotAllowedException("Invalid teacher LAN IP (public, loopback, or non-LAN addresses are blocked): " + teacherLanIp);
        }

        if (rawSubnetsCsv == null || rawSubnetsCsv.isBlank()) {
            return List.of(deriveDefaultCidr(cleanTeacherIp));
        }

        List<String> validated = new ArrayList<>();
        for (String entry : rawSubnetsCsv.split(",")) {
            String trimmed = entry.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            validatePrivateCidr(trimmed);
            validated.add(trimmed);
        }

        if (validated.isEmpty()) {
            validated.add(deriveDefaultCidr(cleanTeacherIp));
        }

        if (!isIpInAnyCidr(cleanTeacherIp, validated)) {
            throw new OperationNotAllowedException("Teacher companion LAN IP (" + cleanTeacherIp + ") must fall within the configured allowed classroom subnets");
        }
        return validated;
    }

    public void validatePrivateCidr(String cidr) {
        if (cidr == null || !cidr.contains("/")) {
            throw new OperationNotAllowedException("Invalid CIDR subnet notation: " + cidr);
        }
        String[] parts = cidr.split("/", -1);
        if (parts.length != 2) {
            throw new OperationNotAllowedException("Invalid CIDR subnet notation: " + cidr);
        }
        String networkIp = normalizeIp(parts[0]);
        if (!isValidIpLiteral(networkIp)) {
            throw new OperationNotAllowedException("Invalid CIDR network IP: " + cidr);
        }
        int prefix;
        try {
            prefix = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            throw new OperationNotAllowedException("Invalid CIDR prefix length: " + cidr);
        }

        boolean ipv4 = IPV4_LITERAL.matcher(networkIp).matches();
        int minPrefix = ipv4 ? 8 : 16;
        int maxPrefix = ipv4 ? 32 : 128;
        if (prefix < minPrefix || prefix > maxPrefix) {
            throw new OperationNotAllowedException("CIDR prefix out of secure bounds for classroom subnet: " + cidr);
        }
        if (ipv4) {
            if (!isPrivateIpv4Cidr(networkIp, prefix)) {
                throw new OperationNotAllowedException("Subnet must remain strictly inside RFC 1918 private LAN ranges: " + cidr);
            }
        } else if (!isPrivateLanIp(networkIp)) {
            throw new OperationNotAllowedException("IPv6 subnet must remain inside Unique Local Address space (fc00::/7): " + cidr);
        }
    }

    private boolean isPrivateIpv4Cidr(String networkIp, int prefix) {
        try {
            byte[] addr = InetAddress.getByName(networkIp).getAddress();
            int b0 = addr[0] & 0xFF;
            int b1 = addr[1] & 0xFF;
            if (b0 == 10 && prefix >= 8) {
                return true;
            }
            if (b0 == 172 && b1 >= 16 && b1 <= 31 && prefix >= 12) {
                return true;
            }
            if (b0 == 192 && b1 == 168 && prefix >= 16) {
                return true;
            }
            return false;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    public boolean isIpInAnyCidr(String rawIp, List<String> cidrs) {
        if (cidrs == null || cidrs.isEmpty()) {
            return false;
        }
        for (String cidr : cidrs) {
            if (isIpInCidr(rawIp, cidr)) {
                return true;
            }
        }
        return false;
    }

    public boolean isIpInCidr(String rawIp, String cidr) {
        String ip = normalizeIp(rawIp);
        if (!isValidIpLiteral(ip) || cidr == null || !cidr.contains("/")) {
            return false;
        }
        String[] parts = cidr.trim().split("/", 2);
        String networkIp = normalizeIp(parts[0]);
        int prefix;
        try {
            prefix = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            return false;
        }
        try {
            byte[] ipBytes = InetAddress.getByName(ip).getAddress();
            byte[] netBytes = InetAddress.getByName(networkIp).getAddress();
            if (ipBytes.length != netBytes.length) {
                return false;
            }
            if (prefix < 0 || prefix > ipBytes.length * 8) {
                return false;
            }
            int fullBytes = prefix / 8;
            int remBits = prefix % 8;
            for (int i = 0; i < fullBytes; i++) {
                if (ipBytes[i] != netBytes[i]) {
                    return false;
                }
            }
            if (remBits > 0) {
                int mask = (~0) << (8 - remBits) & 0xFF;
                if ((ipBytes[fullBytes] & mask) != (netBytes[fullBytes] & mask)) {
                    return false;
                }
            }
            return true;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    /**
     * Validates that a participant IP is a valid private LAN address and falls within the session's allowlisted subnets.
     */
    public void validateLanAndSubnet(String rawIp, String allowedSubnetsCsv, String actorLabel) {
        String cleanIp = normalizeIp(rawIp);
        if (!isPrivateLanIp(cleanIp)) {
            throw new OperationNotAllowedException(actorLabel + " IP (" + rawIp + ") rejected: must be a private RFC 1918 / ULA LAN address");
        }
        if (allowedSubnetsCsv == null || allowedSubnetsCsv.isBlank()) {
            throw new OperationNotAllowedException("Classroom session has no configured private LAN allowlist");
        }
        List<String> cidrs = Arrays.stream(allowedSubnetsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        for (String cidr : cidrs) {
            validatePrivateCidr(cidr);
        }
        if (!isIpInAnyCidr(cleanIp, cidrs)) {
            throw new OperationNotAllowedException(actorLabel + " IP (" + cleanIp + ") is outside allowlisted classroom LAN subnets [" + allowedSubnetsCsv + "]");
        }
    }

    /**
     * Rejects forwarded/proxy headers to prevent relay, VPN tunnel, or reverse-proxy spoofing of classroom locality.
     */
    public void rejectProxyHeaders(HttpServletRequest request) {
        if (request == null) {
            return;
        }
        Enumeration<String> names = request.getHeaderNames();
        if (names == null) {
            return;
        }
        while (names.hasMoreElements()) {
            String headerName = names.nextElement();
            if (headerName != null && FORBIDDEN_PROXY_HEADERS.contains(headerName.toLowerCase(Locale.ROOT))) {
                String value = request.getHeader(headerName);
                if (value != null && !value.isBlank()) {
                    throw new OperationNotAllowedException("Proxy or forwarded header rejected for local handshake security: " + headerName);
                }
            }
        }
    }

    /**
     * Overload for direct header-map inspection in services and tests.
     */
    public void rejectProxyHeaders(Map<String, String> headers) {
        if (headers == null || headers.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null
                    && FORBIDDEN_PROXY_HEADERS.contains(entry.getKey().toLowerCase(Locale.ROOT))
                    && entry.getValue() != null
                    && !entry.getValue().isBlank()) {
                throw new OperationNotAllowedException("Proxy or forwarded header rejected for local handshake security: " + entry.getKey());
            }
        }
    }
}
