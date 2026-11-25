package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "attendance_sessions",
        indexes = {
                @Index(name = "idx_att_sess_uuid", columnList = "session_uuid"),
                @Index(name = "idx_att_sess_teacher", columnList = "teacher_id"),
                @Index(name = "idx_att_sess_section", columnList = "section_id"),
                @Index(name = "idx_att_sess_status", columnList = "status")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSession extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_uuid", nullable = false, unique = true, length = 64)
    private String sessionUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "room_number")
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private AttendanceSessionStatus status = AttendanceSessionStatus.CREATED;

    @Column(name = "qr_secret", nullable = false, length = 128)
    private String qrSecret;

    @Column(name = "local_server_ip")
    private String localServerIp;

    @Column(name = "local_server_port")
    private Integer localServerPort;

    @Column(name = "teacher_ed25519_public_key", length = 256)
    private String teacherEd25519PublicKey;

    @Column(name = "teacher_x25519_public_key", length = 256)
    private String teacherX25519PublicKey;

    @Column(name = "allowed_subnets", length = 512)
    private String allowedSubnets;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    @OneToMany(mappedBy = "attendanceSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentAttendance> studentAttendances = new ArrayList<>();
}
