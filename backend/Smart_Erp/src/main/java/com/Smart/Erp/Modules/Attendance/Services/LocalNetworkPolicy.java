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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enforces strict local-network / Teacher Hotspot validation for WebRTC peer-to-peer handshakes:
 * - Rejects STUN server-reflexive (srflx) and TURN relay candidates
 * - Enforces RFC 1918 private IPv4 (10/8, 172.16/12, 192.168/16 — covers campus Wi-Fi & mobile hotspots)
 *   or IPv6 ULA (fc00::/7), or local-only mDNS host candidates on the same L2 hotspot/LAN broadcast domain
 * - Rejects public/internet IPs and forwarding/proxy headers
 */
@Service
public class LocalNetworkPolicy {

    public static final String DEFAULT_LAN_HOTSPOT_SUBNETS = "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16";
    public static final String WEBRTC_MDNS_LOCAL_TOKEN = "WEBRTC_MDNS_LOCAL";

    private static final Pattern IPV4_LITERAL = Pattern.compile(
            "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$"
    );
    private static final Pattern IPV6_LITERAL = Pattern.compile("^[0-9a-fA-F:]+$");
    private static final Pattern ICE_CANDIDATE_PATTERN = Pattern.compile(
            "candidate:\\S+\\s+\\d+\\s+\\S+\\s+\\d+\\s+(\\S+)\\s+\\d+\\s+typ\\s+(\\S+)",
            Pattern.CASE_INSENSITIVE
    );

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
     * Checks whether the address belongs strictly to RFC 1918 private IPv4 LAN/Hotspot space
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

    /**
     * Parses, validates, and normalizes allowed classroom/hotspot subnets.
     * When blank, defaults to RFC 1918 private LAN & hotspot ranges so both campus Wi-Fi
     * and Teacher mobile/laptop hotspots work seamlessly while public networks remain blocked.
     */
    public List<String> normalizeAndValidateSubnets(String rawSubnetsCsv, String teacherLanIp) {
        String sourceCsv = (rawSubnetsCsv == null || rawSubnetsCsv.isBlank())
                ? DEFAULT_LAN_HOTSPOT_SUBNETS
                : rawSubnetsCsv;

        List<String> validated = new ArrayList<>();
        for (String entry : sourceCsv.split(",")) {
            String trimmed = entry.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            validatePrivateCidr(trimmed);
            validated.add(trimmed);
        }

        if (validated.isEmpty()) {
            return List.of("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16");
        }

        if (teacherLanIp != null && !teacherLanIp.isBlank()
                && !"WEBRTC_P2P".equalsIgnoreCase(teacherLanIp.trim())) {
            String cleanTeacherIp = normalizeIp(teacherLanIp);
            if (!isPrivateLanIp(cleanTeacherIp)) {
                throw new OperationNotAllowedException("Invalid teacher LAN IP (public or loopback addresses are blocked): " + teacherLanIp);
            }
            if (!isIpInAnyCidr(cleanTeacherIp, validated)) {
                throw new OperationNotAllowedException("Teacher IP (" + cleanTeacherIp + ") must fall within allowed classroom/hotspot subnets");
            }
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
                throw new OperationNotAllowedException("Subnet must remain strictly inside RFC 1918 private LAN/hotspot ranges: " + cidr);
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

    public boolean isLinkLocalIpv6(String rawIp) {
        String ip = normalizeIp(rawIp);
        if (!ip.contains(":") || !IPV6_LITERAL.matcher(ip).matches()) {
            return false;
        }
        try {
            InetAddress addr = InetAddress.getByName(ip);
            return (addr instanceof Inet6Address) && addr.isLinkLocalAddress();
        } catch (UnknownHostException e) {
            return false;
        }
    }

    /**
     * Validates a signaled ICE candidate string: only direct local `typ host` candidates
     * (RFC1918 private IPv4, ULA IPv6 fc00::/7, link-local IPv6 fe80::/10, or mDNS `.local`)
     * are permitted. `srflx` and `relay` are rejected.
     */
    public void validateSignaledIceCandidate(String candidateLine, String allowedSubnetsCsv) {
        if (candidateLine == null || candidateLine.isBlank()) {
            return;
        }
        Matcher m = ICE_CANDIDATE_PATTERN.matcher(candidateLine);
        if (!m.find()) {
            throw new OperationNotAllowedException("Malformed WebRTC ICE candidate rejected");
        }
        String address = m.group(1).trim();
        String typ = m.group(2).trim().toLowerCase(Locale.ROOT);
        if (!"host".equals(typ)) {
            throw new OperationNotAllowedException(
                    "Non-local WebRTC ICE candidate type '" + typ + "' rejected; only direct local/hotspot host candidates are allowed."
            );
        }
        if (address.toLowerCase(Locale.ROOT).endsWith(".local") || isLinkLocalIpv6(address)) {
            return;
        }
        validateLanAndSubnet(address, allowedSubnetsCsv, "WebRTC ICE candidate");
    }

    /**
     * Validates WebRTC peer transport metadata received during handshake verification.
     * Direct P2P with iceServers=[] produces `host` or `prflx` (peer-reflexive LAN binding check).
     * STUN `srflx` and TURN `relay` are strictly rejected, and concrete IPs must match RFC 1918 / allowedSubnets.
     */
    public void validateWebRtcPeer(String rawPeerAddress, String iceCandidateType, String allowedSubnetsCsv, String actorLabel) {
        String cleanType = iceCandidateType == null ? "" : iceCandidateType.trim().toLowerCase(Locale.ROOT);
        if (!cleanType.isEmpty() && !"host".equals(cleanType) && !"prflx".equals(cleanType)) {
            throw new OperationNotAllowedException(
                    actorLabel + " WebRTC candidate type '" + iceCandidateType + "' rejected: relay/STUN remote NAT traversal is blocked."
            );
        }
        if (WEBRTC_MDNS_LOCAL_TOKEN.equalsIgnoreCase(rawPeerAddress == null ? "" : rawPeerAddress.trim())
                || isLinkLocalIpv6(rawPeerAddress)) {
            if (!"host".equals(cleanType) && !"prflx".equals(cleanType)) {
                throw new OperationNotAllowedException(actorLabel + " local link/mDNS candidate must declare direct local iceCandidateType ('host' or 'prflx')");
            }
            return;
        }
        validateLanAndSubnet(rawPeerAddress, allowedSubnetsCsv, actorLabel);
    }

    /**
     * Validates that a participant IP is a valid private LAN/hotspot address and falls within the session's allowlisted subnets.
     */
    public void validateLanAndSubnet(String rawIp, String allowedSubnetsCsv, String actorLabel) {
        String cleanIp = normalizeIp(rawIp);
        if (!isPrivateLanIp(cleanIp)) {
            throw new OperationNotAllowedException(actorLabel + " IP (" + rawIp + ") rejected: must be a private RFC 1918 / ULA LAN or hotspot address");
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
            throw new OperationNotAllowedException(actorLabel + " IP (" + cleanIp + ") is outside allowlisted classroom LAN/hotspot subnets [" + allowedSubnetsCsv + "]");
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
