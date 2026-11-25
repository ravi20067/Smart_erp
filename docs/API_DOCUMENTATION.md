# Complete REST & WebSocket API Documentation
## Attendance Module Specification

---

## 1. Authentication & Base Headers

All requests to the Spring Boot Attendance API require standard JWT Bearer authentication:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

Role-based authorization enforces access according to user role:
- `/teacher/attendance/**` requires role `TEACHER`
- `/student/attendance/**` requires role `STUDENT`
- `/security-guard/check-in/**` requires role `SECURITY_GUARD`
- `/admin/attendance/**` requires role `ADMIN` or `SUPER_ADMIN`

---

## 2. Teacher Endpoints (`/teacher/attendance`)

### 1. Get Dropdown Filters
- **`GET /teacher/attendance/filters`**
- Retrieves academic years, courses, sections, and enrolled subjects for the logged-in teacher.
- **Response**:
```json
{
  "academicYears": [{"id": 1, "name": "2026-2027", "code": "AY-26"}],
  "courses": [{"id": 4, "name": "B.Tech Computer Science", "code": "CS-UG"}],
  "sections": [{"id": 12, "name": "Section A", "capacity": 60}],
  "subjects": [{"id": 8, "name": "Operating Systems", "code": "CS301"}]
}
```

### 2. Start Attendance Session
- **`POST /teacher/attendance/start`**
- **Request**:
```json
{
  "academicYearId": 1,
  "courseId": 4,
  "sectionGroupId": 12,
  "subjectId": 8,
  "localServerIp": "192.168.1.105",
  "localServerPort": 7788
}
```
- **Response**:
```json
{
  "sessionId": "4f9d2a6b-8711-4e78-b11c-2df5e8c14829",
  "status": "IN_PROGRESS",
  "startedAt": "2026-11-25T11:30:00",
  "qrPayload": "{\"sessionId\":\"4f9d2a6b...\",\"teacherId\":14,\"localServerIp\":\"192.168.1.105\",\"localServerPort\":7788,\"timestamp\":1700900000000,\"expiry\":1700900060000,\"nonce\":\"a7b3...\",\"signature\":\"e3b0...\"}",
  "qrExpirySeconds": 60,
  "totalEnrolled": 58,
  "presentCount": 0
}
```

### 3. Refresh Dynamic QR Token
- **`POST /teacher/attendance/session/{sessionId}/refresh-qr`**
- Generates a fresh HMAC-signed QR token for an active session with a 60s TTL.
- **Response**: Returns updated `qrPayload` string and new nonce.

### 4. End Attendance Session
- **`POST /teacher/attendance/session/{sessionId}/stop`**
- Closes the attendance session. Inactivates QR acceptance and calculates final statistics.

### 5. Get Session Statistics
- **`GET /teacher/attendance/session/{sessionId}/stats`**
- **Response**:
```json
{
  "sessionId": "4f9d2a6b-8711-4e78-b11c-2df5e8c14829",
  "totalEnrolled": 58,
  "presentCount": 46,
  "attendancePercentage": 79.31,
  "active": true
}
```

---

## 3. Student Endpoints (`/student/attendance`)

### 1. Initiate Face Verification
- **`POST /student/attendance/verify/start`**
- **Request**:
```json
{
  "attendanceSessionId": "4f9d2a6b-8711-4e78-b11c-2df5e8c14829"
}
```
- **Response**:
```json
{
  "verificationSessionId": "f9a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "firstChallenge": "LOOK_STRAIGHT",
  "totalChallenges": 3,
  "currentChallengeIndex": 0,
  "status": "INITIATED"
}
```

### 2. Submit Challenge Video Frames
- **`POST /student/attendance/verify/challenge`**
- **Request**:
```json
{
  "verificationSessionId": "f9a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "challenge": "LOOK_STRAIGHT",
  "framesBase64": [
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...",
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD..."
  ]
}
```
- **Response**:
```json
{
  "challengePassed": true,
  "nextChallenge": "BLINK_TWICE",
  "allChallengesCompleted": false,
  "similarityScore": null,
  "verificationCompleted": false,
  "status": "CHALLENGE_IN_PROGRESS"
}
```

### 3. Complete Verification & Continuous Face Matching
- **`POST /student/attendance/verify/complete`**
- Finalizes frame collection, pulls the highest-quality frontal frame embedding from Python Face AI, decrypts the enrolled template, and checks cosine similarity against 0.363.
- **Response**:
```json
{
  "verificationSessionId": "f9a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "allChallengesCompleted": true,
  "similarityScore": 0.842,
  "verificationCompleted": true,
  "status": "COMPLETED"
}
```

### 4. Verify Local LAN Proximity Handshake
- **`POST /student/attendance/handshake/verify`**
- Submits the proximity receipt acquired from the teacher's local companion server.
- **Request**:
```json
{
  "attendanceSessionId": "4f9d2a6b-8711-4e78-b11c-2df5e8c14829",
  "receiptToken": "rcpt_7f8a9b2c3d4e...",
  "nonce": "a7b3c9f2e4d1..."
}
```
- **Response**:
```json
{
  "success": true,
  "status": "HANDSHAKE_VERIFIED",
  "message": "Local network handshake successfully validated."
}
```

### 5. Generate Student Check-In QR
- **`GET /student/attendance/check-in-qr`**
- Generates a 5-minute single-use QR token for the security guard to scan.
- **Response**:
```json
{
  "checkInToken": "chk_8f1a2b3c4d5e6f...",
  "expiresAt": "2026-11-25T11:45:00",
  "ttlSeconds": 300,
  "studentName": "Aarav Sharma",
  "registrationNumber": "STU-2026-0102"
}
```

### 6. Student Attendance History
- **`GET /student/attendance/history`**
- Retrieves the complete historical log of classes attended with timestamps and verification flags.

---

## 4. Security Guard Endpoints (`/security-guard/check-in`)

### 1. Scan Student Check-In QR
- **`POST /security-guard/check-in/scan`**
- Decodes the token, verifies pre-conditions, and returns student profile and biometric status.

### 2. Stream Registered Student Photo
- **`GET /security-guard/check-in/student-photo/{studentId}`**
- Secure binary stream of the enrolled passport photo.

### 3. Record Guard Decision
- **`POST /security-guard/check-in/decide`**
- Executes the final 10-point atomic verification check and marks the attendance record.

### 4. Guard Shift Audit History
- **`GET /security-guard/check-in/history`**
- Returns all approvals and rejections made by the logged-in guard during their shift.

---

## 5. WebSocket Telemetry (STOMP via `/ws`)

The application supports STOMP over SockJS at endpoint `/ws`.

### Topics
1. **`/topic/attendance/session/{sessionId}`**:
   - Subscribed to by the Teacher UI.
   - Pushes real-time `STUDENT_VERIFIED` events whenever a student is approved by the guard:
```json
{
  "type": "STUDENT_VERIFIED",
  "sessionId": "4f9d2a6b-8711-4e78-b11c-2df5e8c14829",
  "studentId": 102,
  "studentName": "Aarav Sharma",
  "registrationNumber": "STU-2026-0102",
  "markedAt": "2026-11-25T11:42:15",
  "totalPresent": 47
}
```

2. **`/topic/attendance/student/{studentId}`**:
   - Subscribed to by the Student UI.
   - Pushes `ATTENDANCE_MARKED` or `ATTENDANCE_REJECTED` notifications.
