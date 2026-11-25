# Security Guard Check-In Station
## Gatekeeper Physical Inspection & Verification Module

---

## 1. Overview & Purpose

The Security Guard Check-In Module forms the final physical inspection checkpoint in the Smart ERP attendance pipeline. It ensures that even in edge cases of photographic or biometric manipulation, an authorized human officer verifies the student's physical identity before permanent attendance records are committed.

```
+-------------------------------------------------------------+
|               STUDENT CHECK-IN QR WORKFLOW                  |
|                                                             |
|   [Student Device]                 [Security Guard Station] |
|   1. Face Liveness Passed               1. Scan Student QR  |
|   2. Face Identity Matched              2. View ID & Photo  |
|   3. LAN Handshake Passed               3. Match Face       |
|   4. Generate Check-In QR  ======>      4. Click Approve    |
|      (5-minute TTL)                           or Reject     |
+-------------------------------------------------------------+
```

---

## 2. Security Guard UI Features

The dedicated interface is accessible to authenticated `SECURITY_GUARD` users at `/security-guard/check-in`:

1. **Real-Time Camera Barcode / QR Scanner**: Continuous video scanning with visual viewfinder box and torch/flash toggle.
2. **Side-by-Side Verification Display**:
   - Registered student passport photograph streamed directly from secure backend storage.
   - Student Full Name, University Registration Number, and Roll Number.
   - Course, Department, Academic Year, and Class Section.
   - Live status badges: Liveness $(\checkmark)$, SFace Similarity score $(\ge 0.363)$, LAN Handshake $(\checkmark)$.
3. **One-Click Decision Actions**:
   - **Approve (Green)**: Confirms identity and triggers atomic backend attendance commitment.
   - **Reject (Red)**: Opens mandatory rejection modal requiring documented reasoning.
4. **Mandatory Rejection Reasons**:
   - `IMPERSONATION_ATTEMPT`: Student is attempting to check in on behalf of another individual.
   - `UNAUTHORIZED_ACCESS`: Student is not scheduled or permitted in this block/classroom.
   - `PHOTO_MISMATCH`: Visual appearance does not correspond to enrolled institutional photo.
   - `SUSPICIOUS_BEHAVIOR`: Refusal to comply with security officer directives.
   - `OTHER`: Free-text justification required.
5. **Shift Activity Audit Table**: Displays a live log of all check-ins approved or rejected during the current guard shift.

---

## 3. Concurrency Protection & Anti-Fraud Logic

### A. Single-Use Check-In Tokens
The Student Check-In QR encapsulates a cryptographically random token (`check_in_token`) generated via `SecureRandom` with a strict **5-minute TTL**. Once scanned and decided upon, the token transitions to `APPROVED` or `REJECTED` and cannot be re-used.

### B. Distributed Locking in Redis
To prevent race conditions where two security guards at different gate posts or doors scan the exact same student QR token at the exact same millisecond:
```java
String lockKey = "lock:guard_decision:" + request.getCheckInToken();
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(10));

if (!Boolean.TRUE.equals(acquired)) {
    throw new IllegalStateException("Verification decision already in progress by another security guard");
}
```

### C. Secure Image Streaming
Student identity photographs are sensitive PII and biometrics. The guard station never exposes public S3/disk paths. The photo is requested through `/security-guard/check-in/student-photo/{studentId}` which enforces:
- Valid `SECURITY_GUARD` or `ADMIN` role JWT.
- Streams image bytes directly with `Content-Type: image/jpeg` and `Cache-Control: private, no-store`.

---

## 4. REST API Specification

### 1. Scan Student Check-In QR
- **Endpoint**: `POST /security-guard/check-in/scan`
- **Authorization**: `Bearer <GUARD_JWT>`
- **Request**:
```json
{
  "checkInToken": "chk_8f1a2b3c4d5e6f..."
}
```
- **Response**:
```json
{
  "checkInId": "5a2d1e8c-9b7a-4c3d-8e1f-2a3b4c5d6e7f",
  "checkInToken": "chk_8f1a2b3c4d5e6f...",
  "studentId": 102,
  "studentName": "Aarav Sharma",
  "registrationNumber": "STU-2026-0102",
  "courseName": "B.Tech Computer Science",
  "sectionName": "Section A",
  "photoUrl": "/security-guard/check-in/student-photo/102",
  "livenessPassed": true,
  "identityVerified": true,
  "similarityScore": 0.812,
  "handshakeVerified": true,
  "expiresAt": "2026-11-25T11:45:00"
}
```

### 2. Guard Decision (Approve / Reject)
- **Endpoint**: `POST /security-guard/check-in/decide`
- **Authorization**: `Bearer <GUARD_JWT>`
- **Request**:
```json
{
  "checkInToken": "chk_8f1a2b3c4d5e6f...",
  "decision": "APPROVED",
  "rejectionReason": null
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Student check-in approved successfully. Attendance marked.",
  "attendanceMarked": true,
  "studentName": "Aarav Sharma",
  "status": "APPROVED",
  "decidedAt": "2026-11-25T11:42:15"
}
```
