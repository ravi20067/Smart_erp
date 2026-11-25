-- Reference MySQL 8.x DDL aligned with active JPA / Hibernate entities (spring.jpa.hibernate.ddl-auto=update)
-- Note: Smart_Erp runs Hibernate ddl-auto=update without Flyway; all primary keys use BIGINT AUTO_INCREMENT
-- matching @GeneratedValue(strategy = GenerationType.IDENTITY).
-- Legacy teacher-device punch tables (devices, teacher_attendance) were decommissioned without auto-dropping old data.

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(64) NOT NULL UNIQUE,
    teacher_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    room_number VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL,
    qr_secret VARCHAR(128) NOT NULL,
    local_server_ip VARCHAR(255) NULL,
    local_server_port INT NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by_id BIGINT NULL,
    updated_by_id BIGINT NULL,
    INDEX idx_att_sess_uuid (session_uuid),
    INDEX idx_att_sess_teacher (teacher_id),
    INDEX idx_att_sess_section (section_id),
    INDEX idx_att_sess_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_face_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE,
    encrypted_embedding TEXT NOT NULL,
    embedding_dimension INT NOT NULL DEFAULT 128,
    algorithm VARCHAR(32) NOT NULL DEFAULT 'SFACE',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    enrolled_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by_id BIGINT NULL,
    updated_by_id BIGINT NULL,
    UNIQUE KEY uk_student_face_template (student_id),
    INDEX idx_sft_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS face_verification_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    attendance_session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    challenge_sequence VARCHAR(256) NOT NULL,
    current_challenge_index INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at DATETIME(6) NOT NULL,
    face_continuity_score DOUBLE NULL,
    anti_spoof_confidence DOUBLE NULL,
    matched_similarity DOUBLE NULL,
    failure_reason VARCHAR(512) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by_id BIGINT NULL,
    updated_by_id BIGINT NULL,
    INDEX idx_fvs_session_id (session_id),
    INDEX idx_fvs_student (student_id),
    INDEX idx_fvs_status (status),
    CONSTRAINT fk_fvs_att_session FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS face_verification_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    verification_session_id BIGINT NOT NULL,
    challenge_action VARCHAR(64) NOT NULL,
    accepted BIT(1) NOT NULL,
    confidence DOUBLE NULL,
    observations_json TEXT NULL,
    attempt_number INT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by_id BIGINT NULL,
    updated_by_id BIGINT NULL,
    INDEX idx_fva_session (verification_session_id),
    CONSTRAINT fk_fva_session FOREIGN KEY (verification_session_id) REFERENCES face_verification_sessions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS local_handshake_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attendance_session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    receipt_id VARCHAR(64) NOT NULL UNIQUE,
    client_ip VARCHAR(64) NOT NULL,
    teacher_server_ip VARCHAR(64) NOT NULL,
    teacher_server_port INT NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    INDEX idx_lhr_receipt (receipt_id),
    INDEX idx_lhr_session (attendance_session_id),
    INDEX idx_lhr_student (student_id),
    CONSTRAINT fk_lhr_att_session FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
