# Cryptographic WebRTC Local-Network / Hotspot Handshake & Campus Gate Architecture

## 1. Dual-Role Campus Check-In / Check-Out (Students & Teachers)

Both `STUDENT` and `TEACHER` authenticate with Smart ERP and generate short-lived (`5 min`) identity-bound Campus Gate QR tokens (`CHECK_IN` / `CHECK_OUT`) via `/student/campus-check-in/*` and `/teacher/campus-check-in/*`.

- **Security Guard Verification (`SecurityGuardCheckIn`)**: Displays trusted ERP portrait plus role-specific metadata (Student: Enrollment/Reg No, Course, Section, Academic Year; Teacher: Employee ID, Department, Designation).
- **Business Rules**: `CHECK_OUT` requires an approved open `CHECK_IN`; duplicates prevented via Redis locks; multiple entry/exit cycles supported; full audit & decision history preserved; Teacher campus logs stay separate from `StudentAttendance`.
- **Classroom Dependency**: `FaceVerificationService`, `LocalHandshakeService`, `WebRtcSignalingController`, `CheckInService`, and `AttendanceDecisionService` enforce `campusCheckInService.requireOpenCampusCheckIn(student)`.

---

## 2. Pure Browser WebRTC Cryptographic Handshake (Classroom Wi-Fi & Teacher Hotspot)

Zero separate HTTPS companion server or manual LAN IP/port entry is needed:

1. **Session Startup & Python AI Health (`TeacherAttendanceManager.tsx`)**:
   - Teacher terminal queries `GET /teacher/attendance/face-ai/health` (backed by Python `GET /internal/v1/face/health` + `/models/status`) so faculty see real-time model readiness (`YuNet`, `SFace`, `MiniFASNetV2`, `MediaPipe Landmarks`) and latency.
   - Teacher browser generates ephemeral in-memory `@noble` **Ed25519** + **X25519** keypairs (non-extractable private keys held in tab memory only).
   - Starts the Spring Boot attendance session (`localServerIp = "WEBRTC_P2P"`, `allowedSubnets` defaulting to RFC 1918 LAN & Hotspot ranges `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`) and listens on `/topic/webrtc/teacher/{sessionUuid}`.
2. **Biometric-First Flow + Buffered Host-Only ICE (`iceServers: []`) Over Wi-Fi or Teacher Hotspot**:
   - Student discovers eligible sessions (`GET /student/attendance/active-sessions`), passes Liveness + Face Template Match (`VerificationState.PASSED`) **first**, then scans Teacher's QR to unlock WebRTC handshake.
   - Both Teacher and Student initialize `new RTCPeerConnection({ iceServers: [] })`, wait up to `1200ms` for ICE host gathering to embed host candidates into SDP Offer/Answer, and buffer out-of-order trickle ICE candidates until `setRemoteDescription` completes.
   - `WebRtcSignalingController` and `LocalNetworkPolicy` filter ICE candidates so only direct local `typ host` / `typ prflx` candidates (RFC 1918 Wi-Fi/Hotspot IPv4, ULA IPv6 `fc00::/7`, L2 link-local IPv6 `fe80::/10`, or `.local` mDNS) are permitted. `srflx` and `relay` candidates are rejected immediately.
3. **End-to-End DTLS DataChannel Cryptography & Teacher Final Attendance Token**:
   - Over the DTLS-encrypted `RTCDataChannel("smart-erp-handshake")`, Teacher verifies Spring Boot's Ed25519 ticket signature, both peers run **X25519** ECDH + **HKDF-SHA256** (`smart-erp-local-handshake-v1`) + **HMAC-SHA256**, and Teacher signs & emits `RECEIPT_RES` carrying the **Final Signed Attendance Token** (`finalAttendanceToken` / `companionReceiptId` + `teacherReceiptSignature` + `receiptHmac`).
4. **Independent Server Verification & Direct Attendance Marking (`LocalHandshakeService` -> `AttendanceDecisionService`)**:
   - Verifies open Campus Check-In, passed Face Verification, anti-proxy headers (`X-Forwarded-For`, `Forwarded`, `Via`, `X-Real-IP`, `CF-Connecting-IP`), QR HMAC signature, single-use ticket, student/teacher Ed25519 signatures, host-only WebRTC peer transport, and atomic Redis/DB replay prevention — then immediately marks `StudentAttendance` (`PRESENT`).

---

## 3. Known Environmental Limitations (VPNs, Firewalls, Client Isolation)

- **VPNs & Proxies**: Any active device VPN or proxy forwarding headers disrupts local WebRTC peer routing and is rejected by `LocalNetworkPolicy`.
- **Wi-Fi Client / AP Isolation**: Campus Wi-Fi routers with peer-to-peer isolation block direct Wi-Fi UDP/TCP host candidates between student and teacher devices; in those rooms, using the Teacher's mobile/laptop Hotspot bypasses router client isolation safely while staying strictly local (`iceServers: []`).
- **Browser Tab Lifecycle**: Teacher in-memory private keys intentionally disappear if the Teacher reloads/closes the tab; ending and starting a fresh session issues new ephemeral keys.
