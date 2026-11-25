# Cryptographic Local-Network Handshake & Dual-Role Campus Gate Architecture

## 1. Dual-Role Campus Check-In / Check-Out (Students & Teachers)

Both `STUDENT` and `TEACHER` authenticate with Smart ERP and generate short-lived (`5 min`) identity-bound Campus Gate QR tokens (`CHECK_IN` / `CHECK_OUT`) via `/student/campus-check-in/*` and `/teacher/campus-check-in/*`.

### Gate Verification & Business Rules (`CampusCheckInService`)
- Security Guards (`SECURITY_GUARD`) scan QR passes on `/security-guard/check-in` and inspect the trusted ERP photograph retrieved directly from `FileService` alongside role-specific metadata:
  - **Student**: Enrollment / Registration Number, Course, Section, Academic Year
  - **Teacher**: Employee ID, Department, Designation
- Separate `CHECK_IN` and `CHECK_OUT` rows are persisted in `campus_check_ins` with full audit trail (`guard_id`, `decision_by_user_id`, timestamps, status, `rejection_reason`, `device_details`).
- **Entry/Exit Integrity**:
  - `CHECK_OUT` requires an active approved open `CHECK_IN` (`checkedOut == false`).
  - Duplicate open `CHECK_IN` passes and duplicate `CHECK_OUT` passes for an already-closed entry are rejected under Redis distributed locks (`lock:campus_decision:*`, `lock:campus_cycle:*`).
  - Supports multiple legitimate entry/exit cycles on the same day while preserving full historical records.
  - Teacher campus check-ins never touch or depend on `StudentAttendance`.
- **Classroom Attendance Dependency**:
  - Before starting face verification (`FaceVerificationService.startVerification`), verifying local handshake (`LocalHandshakeService.issueHandshakeTicket` / `verifyHandshake`), generating classroom gate QR (`CheckInService.generateStudentCheckInQR`), or recording final classroom attendance (`AttendanceDecisionService.evaluateAndMarkAttendance`), Spring Boot enforces `campusCheckInService.requireOpenCampusCheckIn(student)`. Students outside campus or checked out cannot mark classroom attendance.

---

## 2. Cryptographic Local-Network Handshake (`Ed25519` + `X25519` + `HKDF-SHA256` + `HMAC-SHA256`)

1. **Teacher HTTPS Companion Startup (`npm run handshake:companion`)**
   - Detects and binds strictly to the faculty device's RFC 1918 private LAN interface (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, or IPv6 ULA `fc00::/7`).
   - Generates a fresh in-memory SAN TLS X.509 certificate (`openssl`) plus ephemeral in-memory `Ed25519` and `X25519` keypairs and a single-process `adminControlToken` (zero private keys in repo or browser bundles).
2. **Teacher Session Initialization (`AttendanceSessionService`)**
   - Faculty pairs the dashboard UI with the HTTPS Companion (`GET /companion/keys`) and starts the Spring Boot attendance session with `teacherEd25519PublicKey`, `teacherX25519PublicKey`, and allowlisted classroom CIDRs (`allowedSubnets`, defaulting to the `/24` of the teacher LAN IP).
   - Spring Boot binds those public keys and subnets inside the HMAC-SHA256-signed rotating `TeacherQRPayload` (`60s` validity) alongside Spring Boot's `backendPublicKey` (`Ed25519`).
3. **Student Proximity Proof (`StudentSecureAttendance.tsx` + `handshakeCrypto.ts`)**
   - Student completes face liveness & biometric recognition.
   - Student generates ephemeral in-memory non-extractable WebCrypto `Ed25519` & `X25519` keypairs + a 24-byte CSPRNG `studentNonce`.
   - Spring Boot issues a single-use `60s` `StudentHandshakeTicketResponse` signed with Spring Boot's `Ed25519` private key.
   - Student connects directly over `https://{lanIp}:{port}/handshake/challenge` and `/handshake/complete`:
     - Both sides perform **X25519** Diffie-Hellman + **HKDF-SHA256** (`smart-erp-local-handshake-v1`) to derive a 256-bit session HMAC key.
     - Both sides sign and verify canonical protocol transcripts with **Ed25519** (`HANDSHAKE_CHALLENGE_V1`, `STUDENT_PROOF_V1`, `COMPANION_RECEIPT_V1`).
   - Student submits the Companion-signed receipt and proof chain to `POST /student/attendance/handshake/verify`.
4. **Independent Server-Side Verification (`LocalHandshakeService`)**
   - Verifies Campus Check-In + Passed Face Verification + Student Reference + Teacher ID & pinned public keys.
   - Validates both Teacher LAN IP and Student Peer IP against private RFC 1918 / ULA ranges and `allowedSubnets` CIDRs (`LocalNetworkPolicy`).
   - Rejects forwarding/proxy headers (`X-Forwarded-For`, `Forwarded`, `Via`, `X-Real-IP`, `CF-Connecting-IP`).
   - Independently verifies Teacher QR HMAC, single-use backend ticket, Student Ed25519 proof signature, Teacher Companion Ed25519 receipt signature, expiration window, Redis distributed concurrency lock, and atomic nonce/receipt replay protection.

---

## 3. Known Environmental & Network Limitations (Important Deployment Guidance)

1. **Self-Signed Ephemeral TLS Certificates in Browsers**:
   - Because each classroom Teacher Companion dynamically binds to a temporary RFC 1918 LAN IP and cannot obtain public Let's Encrypt CA certificates on isolated Wi-Fi subnets, it serves an ephemeral SAN X.509 TLS certificate generated per session.
   - **Operational requirement**: Browsers (`Chrome`, `Safari`, `Firefox`) block `fetch("https://<lan-ip>:<port>/...")` until the user explicitly opens `https://<lan-ip>:<port>/health` once on the classroom device and accepts the certificate security prompt (or trusts the campus classroom CA / SHA-256 fingerprint). Mixed content (`HTTP` companion inside an `HTTPS` frontend origin) is intentionally avoided by serving the companion over HTTPS.
2. **VPNs, Corporate Proxies, & Relay Tunnels**:
   - Any active device VPN (e.g., WireGuard, OpenVPN, campus remote-access VPN, iCloud Private Relay, or HTTP proxy) routes peer traffic outside the classroom Wi-Fi subnet or attaches forwarding headers.
   - Both the Companion server and Spring Boot reject non-allowlisted subnets, public IPs, and proxy/forwarding headers (`X-Forwarded-For`, `Forwarded`, `Via`, `X-Real-IP`), so **students and faculty must disable VPNs/proxies on the classroom SSID**.
3. **Client Isolation / AP Isolation & OS Firewalls**:
   - Enterprise Wi-Fi controllers with **AP/Client Isolation** or **Peer-to-Peer blocking** prevent student phones from reaching the teacher's laptop IP on port `8443` even on the same subnet. Classroom SSIDs hosting Smart ERP attendance must allow peer-to-peer traffic on the configured TCP port within the classroom VLAN/CIDR.
   - Host firewalls (`macOS Application Firewall`, `Windows Defender Firewall`, `ufw`) must permit incoming TCP connections to Node on the companion port (`8443` by default) over the private LAN interface.
