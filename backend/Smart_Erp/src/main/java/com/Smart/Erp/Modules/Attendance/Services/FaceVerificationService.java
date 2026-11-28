package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.DTO.ChallengeSubmissionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.StudentVerificationStartResponse;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationAttempt;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.LivenessChallenge;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationAttemptRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentFaceTemplateRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FaceVerificationService {

    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final FaceVerificationAttemptRepository attemptRepository;
    private final StudentFaceTemplateRepository faceTemplateRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepo studentRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final UserRepo userRepo;
    private final ChallengeGenerationService challengeGenerationService;
    private final PythonFaceAiClient pythonFaceAiClient;
    private final BiometricEncryptionService biometricEncryptionService;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final CampusCheckInService campusCheckInService;

    @Value("${app.face-ai.match-threshold:0.363}")
    private double matchThreshold;

    public StudentVerificationStartResponse startVerification(String sessionUuid, String studentUsername) {
        User user = userRepo.findByUsername(studentUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + studentUsername));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student record not found for: " + studentUsername));

        AttendanceSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new RuntimeException("Attendance session not found: " + sessionUuid));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new RuntimeException("Attendance session is not active or has expired");
        }

        // Check if student has already marked attendance
        if (attendanceRepository.existsByAttendanceSessionAndStudent(session, student)) {
            throw new RuntimeException("Attendance has already been marked for this session");
        }

        // Check section enrollment
        boolean isEnrolled = studentEnrollmentRepo.findAllByStudent(student).stream()
                .anyMatch(enrollment -> enrollment.getSectionGroup() != null &&
                        enrollment.getSectionGroup().getSection() != null &&
                        enrollment.getSectionGroup().getSection().getId().equals(session.getSection().getId()));

        if (!isEnrolled) {
            throw new RuntimeException("Access denied: You are not enrolled in section " + session.getSection().getName());
        }

        // Mandatory Gate: Student must have an approved, open Campus Check-In and not be checked out
        campusCheckInService.requireOpenCampusCheckIn(student);

        // Mandatory Sequence Gate: Verify Super Admin has already enrolled the student's face embedding FIRST
        StudentFaceTemplate enrolledTemplate = Optional.ofNullable(student.getFaceTemplate())
                .or(() -> faceTemplateRepository.findByStudent(student))
                .filter(t -> "ACTIVE".equalsIgnoreCase(t.getStatus()))
                .orElseThrow(() -> new RuntimeException(
                        "Biometric face template is not registered for your profile. Please visit the Super Admin console / Registrar to register your face biometrics first."
                ));
        if (enrolledTemplate.getEncryptedEmbedding() == null || enrolledTemplate.getEncryptedEmbedding().isBlank()) {
            throw new RuntimeException("Enrolled face template is incomplete. Please contact Super Admin to re-enroll your face biometrics.");
        }

        // Generate randomized challenge sequence
        List<LivenessChallenge> challenges = challengeGenerationService.generateChallengeSequence();
        String serialized = challengeGenerationService.serializeSequence(challenges);

        String verificationSessionId = "FVS-" + UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(2);

        FaceVerificationSession fvs = FaceVerificationSession.builder()
                .sessionId(verificationSessionId)
                .attendanceSession(session)
                .student(student)
                .challengeSequence(serialized)
                .currentChallengeIndex(0)
                .status(VerificationState.IN_PROGRESS)
                .totalAttempts(0)
                .maxAttempts(6)
                .expiresAt(expiresAt)
                .build();

        verificationSessionRepository.save(fvs);

        // Notify Python microservice of new verification session
        pythonFaceAiClient.createSession(verificationSessionId, challenges.get(0).name(), 120);

        String studentName = user.getBasicDetail() != null
                ? user.getBasicDetail().getFirstName() + " " + user.getBasicDetail().getLastName()
                : student.getRegistrationNumber();

        auditService.logEvent(
                session, student, user, "STUDENT",
                "LIVENESS_STARTED", "NONE", "IN_PROGRESS",
                "Started face verification session. Challenges: " + serialized,
                null
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.LIVENESS_STARTED,
                sessionUuid, student.getId(), studentName, student.getRegistrationNumber(),
                "IN_PROGRESS", "Student started face liveness challenge"
        );

        return StudentVerificationStartResponse.builder()
                .verificationSessionId(verificationSessionId)
                .sessionUuid(sessionUuid)
                .currentChallenge(challenges.get(0).name())
                .challengeDescription(challenges.get(0).getDescription())
                .challengeIndex(0)
                .totalChallenges(challenges.size())
                .expiresAt(expiresAt)
                .build();
    }

    public ChallengeSubmissionResponse processChallengeFrames(
            String verificationSessionId,
            String action,
            int sequenceNumber,
            List<MultipartFile> frameFiles,
            String studentUsername
    ) {
        FaceVerificationSession fvs = verificationSessionRepository.findBySessionId(verificationSessionId)
                .orElseThrow(() -> new RuntimeException("Verification session not found: " + verificationSessionId));

        if (!fvs.getStudent().getUser().getUsername().equals(studentUsername)) {
            throw new RuntimeException("Unauthorized: Verification session does not belong to user " + studentUsername);
        }

        if (LocalDateTime.now().isAfter(fvs.getExpiresAt())) {
            fvs.setStatus(VerificationState.EXPIRED);
            verificationSessionRepository.save(fvs);
            throw new RuntimeException("Verification session has expired. Please restart face authentication.");
        }

        if (fvs.getStatus() == VerificationState.PASSED) {
            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .allChallengesPassed(true)
                    .identityMatched(true)
                    .status("PASSED")
                    .message("Face verification already passed")
                    .build();
        }

        List<LivenessChallenge> challenges = challengeGenerationService.deserializeSequence(fvs.getChallengeSequence());
        if (fvs.getCurrentChallengeIndex() >= challenges.size()) {
            throw new RuntimeException("All challenges already processed");
        }

        LivenessChallenge expectedChallenge = challenges.get(fvs.getCurrentChallengeIndex());
        if (!expectedChallenge.name().equalsIgnoreCase(action.trim())) {
            throw new RuntimeException("Challenge sequence violation: expected " + expectedChallenge.name() + " but received " + action);
        }

        // Read frames into byte arrays
        List<byte[]> frames = new ArrayList<>();
        for (MultipartFile file : frameFiles) {
            try {
                frames.add(file.getBytes());
            } catch (Exception e) {
                log.error("Failed to read frame bytes: {}", e.getMessage());
            }
        }

        if (frames.isEmpty()) {
            throw new RuntimeException("No valid frames received for evaluation");
        }

        fvs.setTotalAttempts(fvs.getTotalAttempts() + 1);

        // Forward to Python Face AI microservice
        JsonNode result = pythonFaceAiClient.sendFrames(
                verificationSessionId,
                expectedChallenge.name(),
                sequenceNumber,
                frames
        );

        boolean accepted = result != null && result.path("accepted").asBoolean(false);
        double confidence = result != null ? result.path("confidence").asDouble(0.0) : 0.0;
        String status = result != null ? result.path("status").asText("EVALUATION_FAILED") : "NO_RESPONSE";
        String message = result != null ? result.path("message").asText("") : "Error evaluating frames";

        // Record attempt
        FaceVerificationAttempt attempt = FaceVerificationAttempt.builder()
                .verificationSession(fvs)
                .challengeAction(expectedChallenge.name())
                .accepted(accepted)
                .confidence(confidence)
                .observationsJson(result != null ? result.path("observations").toString() : "{}")
                .attemptNumber(fvs.getTotalAttempts())
                .timestamp(LocalDateTime.now())
                .build();
        attemptRepository.save(attempt);

        if (!accepted) {
            if (fvs.getTotalAttempts() >= fvs.getMaxAttempts()) {
                fvs.setStatus(VerificationState.FAILED);
                fvs.setFailureReason("Exceeded maximum allowed attempts for challenge " + expectedChallenge.name());
                verificationSessionRepository.save(fvs);

                auditService.logEvent(
                        fvs.getAttendanceSession(), fvs.getStudent(), fvs.getStudent().getUser(), "STUDENT",
                        "LIVENESS_FAILED", "IN_PROGRESS", "FAILED",
                        "Exceeded attempts on " + expectedChallenge.name(), null
                );

                return ChallengeSubmissionResponse.builder()
                        .verificationSessionId(verificationSessionId)
                        .action(expectedChallenge.name())
                        .accepted(false)
                        .confidence(confidence)
                        .allChallengesPassed(false)
                        .status("FAILED")
                        .message("Verification failed: " + fvs.getFailureReason())
                        .build();
            }

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .action(expectedChallenge.name())
                    .accepted(false)
                    .confidence(confidence)
                    .currentChallengeIndex(fvs.getCurrentChallengeIndex())
                    .totalChallenges(challenges.size())
                    .allChallengesPassed(false)
                    .status(status)
                    .message(message)
                    .build();
        }

        // Challenge was accepted!
        int nextIndex = fvs.getCurrentChallengeIndex() + 1;
        fvs.setCurrentChallengeIndex(nextIndex);

        if (nextIndex < challenges.size()) {
            // More challenges to complete
            verificationSessionRepository.save(fvs);
            LivenessChallenge nextChallenge = challenges.get(nextIndex);

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .action(expectedChallenge.name())
                    .accepted(true)
                    .confidence(confidence)
                    .nextChallenge(nextChallenge.name())
                    .nextChallengeDescription(nextChallenge.getDescription())
                    .currentChallengeIndex(nextIndex)
                    .totalChallenges(challenges.size())
                    .allChallengesPassed(false)
                    .status("CHALLENGE_ACCEPTED")
                    .message("Challenge " + expectedChallenge.name() + " passed. Proceed to next challenge.")
                    .build();
        }

        // Retrieve Python liveness evidence summary before completing and cleaning up temporary session state
        JsonNode livenessEvidence = pythonFaceAiClient.getLivenessEvidence(verificationSessionId);

        // All liveness challenges completed! Complete session and extract live embedding
        JsonNode completeNode = pythonFaceAiClient.completeSession(verificationSessionId);
        List<Float> capturedEmbedding = null;
        if (completeNode != null && completeNode.has("captured_embedding") && !completeNode.get("captured_embedding").isNull()) {
            capturedEmbedding = new ArrayList<>();
            for (JsonNode val : completeNode.get("captured_embedding")) {
                capturedEmbedding.add((float) val.asDouble());
            }
        }

        // Retrieve pre-enrolled reference face template (already validated in startVerification)
        StudentFaceTemplate template = faceTemplateRepository.findByStudent(fvs.getStudent())
                .filter(t -> "ACTIVE".equalsIgnoreCase(t.getStatus()))
                .orElse(null);
        List<Float> enrolledEmbedding = template != null
                ? biometricEncryptionService.decryptEmbedding(template.getEncryptedEmbedding())
                : null;

        if (enrolledEmbedding == null || enrolledEmbedding.isEmpty()) {
            fvs.setStatus(VerificationState.FAILED);
            fvs.setFailureReason("Biometric face template not enrolled by Super Admin");
            verificationSessionRepository.save(fvs);

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .allChallengesPassed(true)
                    .identityMatched(false)
                    .status("TEMPLATE_NOT_ENROLLED")
                    .message("No enrolled face biometric template found. Please contact your Super Admin to enroll your face.")
                    .build();
        }

        if (capturedEmbedding == null || capturedEmbedding.isEmpty()) {
            fvs.setStatus(VerificationState.FAILED);
            fvs.setFailureReason("Failed to extract valid face embedding from live camera stream");
            verificationSessionRepository.save(fvs);

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .allChallengesPassed(true)
                    .identityMatched(false)
                    .status("IDENTITY_EXTRACTION_FAILED")
                    .message("Unable to extract clear facial features from the camera feed. Ensure good lighting and try again.")
                    .build();
        }

        // Compare embeddings
        Double similarity = pythonFaceAiClient.compareEmbeddings(
                enrolledEmbedding,
                capturedEmbedding,
                verificationSessionId
        );

        // Purge ephemeral frame/liveness state in Python microservice once embedding extraction & match complete
        try {
            pythonFaceAiClient.deleteSession(verificationSessionId);
        } catch (Exception ignored) {
        }

        fvs.setMatchedSimilarity(similarity);

        boolean matched = similarity != null && similarity >= matchThreshold;

        String studentName = fvs.getStudent().getUser().getBasicDetail() != null
                ? fvs.getStudent().getUser().getBasicDetail().getFirstName() + " " + fvs.getStudent().getUser().getBasicDetail().getLastName()
                : fvs.getStudent().getRegistrationNumber();

        String evidenceNote = (livenessEvidence != null && livenessEvidence.has("blink_observations"))
                ? ", blinks: " + livenessEvidence.path("blink_observations").asInt(0)
                + ", headMoves: " + livenessEvidence.path("head_movement_observations").asInt(0)
                : "";

        if (matched) {
            fvs.setStatus(VerificationState.PASSED);
            verificationSessionRepository.save(fvs);

            auditService.logEvent(
                    fvs.getAttendanceSession(), fvs.getStudent(), fvs.getStudent().getUser(), "STUDENT",
                    "IDENTITY_VERIFIED", "IN_PROGRESS", "PASSED",
                    "Biometric identity verified successfully with cosine similarity " + similarity + " (threshold: " + matchThreshold + evidenceNote + ")",
                    null
            );

            webSocketPublisher.publishEvent(
                    AttendanceEventType.IDENTITY_VERIFIED,
                    fvs.getAttendanceSession().getSessionUuid(),
                    fvs.getStudent().getId(),
                    studentName,
                    fvs.getStudent().getRegistrationNumber(),
                    "PASSED",
                    "Face identity verified (similarity: " + String.format("%.2f", similarity) + ")"
            );

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .action(expectedChallenge.name())
                    .accepted(true)
                    .confidence(confidence)
                    .allChallengesPassed(true)
                    .identityMatched(true)
                    .identitySimilarity(similarity)
                    .status("PASSED")
                    .message("Face verification & identity matching successfully completed!")
                    .build();
        } else {
            fvs.setStatus(VerificationState.FAILED);
            fvs.setFailureReason("Face does not match enrolled profile photo (similarity: " + similarity + " < " + matchThreshold + ")");
            verificationSessionRepository.save(fvs);

            auditService.logEvent(
                    fvs.getAttendanceSession(), fvs.getStudent(), fvs.getStudent().getUser(), "STUDENT",
                    "IDENTITY_FAILED", "IN_PROGRESS", "FAILED",
                    "Face match failed. Similarity " + similarity + " below threshold " + matchThreshold,
                    null
            );

            webSocketPublisher.publishEvent(
                    AttendanceEventType.IDENTITY_FAILED,
                    fvs.getAttendanceSession().getSessionUuid(),
                    fvs.getStudent().getId(),
                    studentName,
                    fvs.getStudent().getRegistrationNumber(),
                    "FAILED",
                    "Face identity verification rejected: face does not match student profile"
            );

            return ChallengeSubmissionResponse.builder()
                    .verificationSessionId(verificationSessionId)
                    .action(expectedChallenge.name())
                    .accepted(true)
                    .confidence(confidence)
                    .allChallengesPassed(true)
                    .identityMatched(false)
                    .identitySimilarity(similarity)
                    .status("IDENTITY_MISMATCH")
                    .message("Face verification failed: Captured face does not match the registered student photograph.")
                    .build();
        }
    }

    public StudentFaceTemplate enrollStudentFace(Student student, byte[] photoBytes, String filename) {
        if (photoBytes == null || photoBytes.length == 0) {
            throw new IllegalArgumentException("Photo data cannot be empty for face biometric enrollment");
        }
        List<Float> extracted = pythonFaceAiClient.extractEnrollmentEmbedding(photoBytes, filename != null ? filename : "student_face.jpg");
        if (extracted == null || extracted.isEmpty()) {
            throw new RuntimeException("No face detected or could not extract clear 128-dimensional biometric embedding from the provided image.");
        }
        String encrypted = biometricEncryptionService.encryptEmbedding(extracted);

        Optional<StudentFaceTemplate> existing = Optional.ofNullable(student.getFaceTemplate())
                .or(() -> faceTemplateRepository.findByStudent(student));
        StudentFaceTemplate template;
        if (existing.isPresent()) {
            template = existing.get();
            template.setEncryptedEmbedding(encrypted);
            template.setEmbeddingDimension(extracted.size());
            template.setAlgorithm("SFACE");
            template.setStatus("ACTIVE");
            template.setEnrolledAt(LocalDateTime.now());
        } else {
            template = StudentFaceTemplate.builder()
                    .student(student)
                    .encryptedEmbedding(encrypted)
                    .embeddingDimension(extracted.size())
                    .algorithm("SFACE")
                    .status("ACTIVE")
                    .enrolledAt(LocalDateTime.now())
                    .build();
        }
        student.assignFaceTemplate(template);
        return faceTemplateRepository.save(template);
    }

    public Optional<StudentFaceTemplate> getStudentFaceTemplate(Student student) {
        if (student == null) return Optional.empty();
        if (student.getFaceTemplate() != null) {
            return Optional.of(student.getFaceTemplate());
        }
        return faceTemplateRepository.findByStudent(student);
    }

    public boolean deleteStudentFaceTemplate(Student student) {
        Optional<StudentFaceTemplate> existing = getStudentFaceTemplate(student);
        if (existing.isPresent()) {
            StudentFaceTemplate tpl = existing.get();
            student.clearFaceTemplate();
            faceTemplateRepository.delete(tpl);
            return true;
        }
        return false;
    }

    public Map<String, Object> getFaceAiHealthReport() {
        var node = pythonFaceAiClient.getServiceHealthAndModels();
        node.put("matchThreshold", matchThreshold);
        return pythonFaceAiClient.nodeToMap(node);
    }

    public Map<String, Object> analyzeFrameDiagnostics(byte[] photoBytes, String filename) {
        if (photoBytes == null || photoBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty for Face AI diagnostic check");
        }
        return pythonFaceAiClient.nodeToMap(pythonFaceAiClient.analyzeFaceDiagnostics(photoBytes, filename));
    }
}
