import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Modules from "./pages/Modules";
import {
  AcademicAdministrationPage,
  StudentManagementPage,
  TeacherManagementPage,
  AttendanceManagementPage,
  TimetableSchedulingPage,
  ReportsAnalyticsPage,
} from "./pages/ModulePages";
import AIAutomation from "./pages/AIAutomation";
import SmartERPChatbot from "./components/assistant/SmartERPChatbot";
import { sendAiQuery } from "./services/aiQueryService";
import { useAuth } from "./services/authContext";
import Solutions from "./pages/Solutions";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/student/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import LibraryDashboard from "./pages/library/Dashboard";
import AdmissionDashboard from "./pages/admission/Dashboard";
import ExaminationDeptDashboard from "./pages/examination/Dashboard";
import FinanceDashboard from "./pages/finance/Dashboard";
import SecurityGuardDashboard from "./pages/security-guard/Dashboard";
import DeanDashboard from "./pages/dean/Dashboard";
import HODDashboard from "./pages/hod/Dashboard";
import ProgramCoordinatorDashboard from "./pages/coordinator/Dashboard";
import MentorDashboard from "./pages/mentor/Dashboard";
import HRDashboard from "./pages/hr/Dashboard";
import CounselorDashboard from "./pages/counselor/Dashboard";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminLayout from "./pages/super-admin/Layout";
import RoleDashboardLayout from "./components/RoleDashboardLayout";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherAttendanceManager from "./pages/teacher/TeacherAttendanceManager";
import StudentSecureAttendance from "./pages/student/StudentSecureAttendance";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentAcademicCalendar from "./pages/student/StudentAcademicCalendar";
import StudentFees from "./pages/student/StudentFees";
import SecurityGuardCheckIn from "./pages/security-guard/SecurityGuardCheckIn";
import CampusCheckInPass from "./pages/shared/CampusCheckInPass";
import { AuthProvider } from "@/services/authContext";
import ProtectedRoute from "@/services/protectedRoute";
import Blog from "./pages/Blog";
import BookDemo from "./pages/BookDemo";
import University from "./pages/organisation/University";
import School from "./pages/organisation/School";
import Departments from "./pages/organisation/Departments";
import AcademicYears from "./pages/academicManagement/AcademicYears";
import Courses from "./pages/academicManagement/Courses";
import Specializations from "./pages/academicManagement/Specializations";
import Sections from "./pages/academicManagement/Sections";
import Subjects from "./pages/academicManagement/Subjects";
import RolePermission from "./pages/userMangement/RolePermission";
import FeeStructure from "./pages/financial/FeeStructure";
import Scholarship from "./pages/financial/Scholarship";
import Rooms from "./pages/timeTable/Room";
import BaseTimeTable from "./pages/timeTable/BaseTimeTable";
import AcademicCalendar from "./pages/timeTable/AcademicCalendar";
import TimetableBuilder from "./pages/timeTable/TimetableBuilder";
import TimetableOverrides from "./pages/timeTable/TimetableOverrides";
import Student from "./pages/userMangement/Student";
import Teacher from "./pages/userMangement/Teacher";
import SecurityGuard from "./pages/userMangement/SecurityGuard";
import TeacherEnrollment from "./pages/userMangement/TeacherEnrollment";
import TeacherAssignRole from "./pages/userMangement/TeacherAssignRole";

import { useRef } from "react";

const queryClient = new QueryClient();

const AuthenticatedChatbot = () => {
  const { isAuthenticated } = useAuth();
  const conversationIdRef = useRef<string | undefined>(undefined);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SmartERPChatbot
      title="Smart ERP AI"
      subtitle="Your multilingual assistant"
      onSend={async (message, language, history) => {
        if (history.length === 0) {
          conversationIdRef.current = undefined;
        }
        const res = await sendAiQuery(message, language, conversationIdRef.current);
        if (res.conversationId) {
          conversationIdRef.current = res.conversationId;
        }
        if (!res.success && !res.requiresClarification) {
          throw new Error(res.message || "Unable to process your request.");
        }
        return res.message;
      }}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>

            {/* Public Routes */}

            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route
              path="/modules/academic-administration"
              element={<AcademicAdministrationPage />}
            />

            <Route
              path="/modules/student-management"
              element={<StudentManagementPage />}
            />

            <Route
              path="/modules/teacher-management"
              element={<TeacherManagementPage />}
            />

            <Route
              path="/modules/attendance"
              element={<AttendanceManagementPage />}
            />

            <Route
              path="/modules/timetable"
              element={<TimetableSchedulingPage />}
            />

            <Route
              path="/modules/analytics"
              element={<ReportsAnalyticsPage />}
            />
            <Route path="/modules" element={<Modules />} />
            <Route path="/ai-automation" element={<AIAutomation />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/book-demo" element={<BookDemo />} />
            <Route path="/test" element={<SuperAdminDashboard />} />
            {/* TEMPORARY UI TEST ROUTE — remove after testing */}
            <Route path="/test-admin" element={<SuperAdminLayout />}>
              <Route index element={<FeeStructure />} />
            </Route>

            {/* Protected Routes */}

            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard: /admin */}
              <Route index element={<SuperAdminDashboard />} />

              {/* Organization */}
              <Route path="universities" element={<University />} />
              <Route path="schools" element={<School />} />
              <Route path="departments" element={<Departments />} />
              <Route path="academic-years" element={<AcademicYears />} />
              <Route path="courses" element={<Courses />} />
              <Route path="specializations" element={<Specializations />} />
              <Route path="sections" element={<Sections />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="role-permissions" element={<RolePermission />} />
              <Route path="fee-structures" element={<FeeStructure />} />
              <Route path="scholarships" element={<Scholarship />} />
              <Route path="rooms" element={<Rooms />} />

              {/* Timetable Management */}
              <Route path="base" element={<BaseTimeTable />} />
              <Route path="base-timetable" element={<BaseTimeTable />} />
              <Route path="academic-calendar" element={<AcademicCalendar />} />
              <Route path="timetable/builder" element={<TimetableBuilder />} />
              <Route path="timetable" element={<TimetableBuilder />} />
              <Route path="timetable/substitutions" element={<TimetableOverrides />} />
              <Route path="timetable/daily" element={<TimetableOverrides />} />
              <Route path="timetable/publish" element={<TimetableBuilder />} />
              <Route path="timetable/conflicts" element={<TimetableBuilder />} />
              <Route path="timetable/reports" element={<TimetableBuilder />} />
              <Route path="timetable/room-allocation" element={<Rooms />} />
              <Route path="timetable/teacher-availability" element={<Teacher />} />
              <Route path="lecture-allocation" element={<TeacherEnrollment />} />

              <Route path="students" element={<Student />} />
              <Route path="teachers" element={<Teacher />} />
              <Route path="security-guards" element={<SecurityGuard />} />
              <Route path="teachers/assign-role" element={<TeacherAssignRole />} />
              <Route path="teachers/subject-enrollment" element={<TeacherEnrollment />} />
              <Route path="teacher-enrollments" element={<TeacherEnrollment />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard: /admin */}
              <Route index element={<SuperAdminDashboard />} />

              {/* Organization & Academics */}
              <Route path="universities" element={<University />} />
              <Route path="schools" element={<School />} />
              <Route path="departments" element={<Departments />} />
              <Route path="academic-years" element={<AcademicYears />} />
              <Route path="courses" element={<Courses />} />
              <Route path="specializations" element={<Specializations />} />
              <Route path="sections" element={<Sections />} />
              <Route path="subjects" element={<Subjects />} />

              {/* Students, Faculty & Finance */}
              <Route path="students" element={<Student />} />
              <Route path="teachers" element={<Teacher />} />
              <Route path="security-guards" element={<SecurityGuard />} />
              <Route path="role-permissions" element={<RolePermission />} />
              <Route path="fees" element={<FeeStructure />} />
              <Route path="fee-structures" element={<FeeStructure />} />
              <Route path="scholarships" element={<Scholarship />} />

              {/* Timetable Management */}
              <Route path="rooms" element={<Rooms />} />
              <Route path="base" element={<BaseTimeTable />} />
              <Route path="base-timetable" element={<BaseTimeTable />} />
              <Route path="academic-calendar" element={<AcademicCalendar />} />
              <Route path="timetable" element={<TimetableBuilder />} />
              <Route path="timetable/builder" element={<TimetableBuilder />} />
              <Route path="timetable/substitutions" element={<TimetableOverrides />} />
              <Route path="timetable/daily" element={<TimetableOverrides />} />
              <Route path="lecture-allocation" element={<TeacherEnrollment />} />
            </Route>

            {/* Student */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <RoleDashboardLayout role="STUDENT" />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="attendance" element={<StudentSecureAttendance />} />
              <Route path="secure-attendance" element={<StudentSecureAttendance />} />
              <Route path="campus-pass" element={<CampusCheckInPass role="STUDENT" />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="calendar" element={<StudentAcademicCalendar />} />
              <Route path="fees" element={<StudentFees />} />
            </Route>

            {/* Teacher */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["TEACHER"]}>
                  <RoleDashboardLayout role="TEACHER" />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="attendance" element={<TeacherAttendanceManager />} />
              <Route path="attendance-authenticator" element={<TeacherAttendanceManager />} />
              <Route path="campus-pass" element={<CampusCheckInPass role="TEACHER" />} />
            </Route>

            {/* Security Guard */}
            <Route
              path="/security-guard"
              element={
                <ProtectedRoute allowedRoles={["SECURITY_GUARD"]}>
                  <RoleDashboardLayout role="SECURITY_GUARD" />
                </ProtectedRoute>
              }
            >
              <Route index element={<SecurityGuardDashboard />} />
              <Route path="check-in" element={<SecurityGuardCheckIn />} />
            </Route>

            {/* Dean / School Dean */}
            <Route
              path="/dean"
              element={
                <ProtectedRoute allowedRoles={["DEAN", "SCHOOL_DEAN"]}>
                  <RoleDashboardLayout role="DEAN" />
                </ProtectedRoute>
              }
            >
              <Route index element={<DeanDashboard />} />
            </Route>
            <Route
              path="/school-dean"
              element={
                <ProtectedRoute allowedRoles={["DEAN", "SCHOOL_DEAN"]}>
                  <RoleDashboardLayout role="SCHOOL_DEAN" />
                </ProtectedRoute>
              }
            >
              <Route index element={<DeanDashboard />} />
            </Route>

            {/* Head of Department */}
            <Route
              path="/head-of-department"
              element={
                <ProtectedRoute allowedRoles={["HEAD_OF_DEPARTMENT"]}>
                  <RoleDashboardLayout role="HEAD_OF_DEPARTMENT" />
                </ProtectedRoute>
              }
            >
              <Route index element={<HODDashboard />} />
            </Route>

            {/* Program Coordinator */}
            <Route
              path="/program-coordinator"
              element={
                <ProtectedRoute allowedRoles={["PROGRAM_COORDINATOR"]}>
                  <RoleDashboardLayout role="PROGRAM_COORDINATOR" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProgramCoordinatorDashboard />} />
            </Route>

            {/* Mentor */}
            <Route
              path="/mentor"
              element={
                <ProtectedRoute allowedRoles={["MENTOR"]}>
                  <RoleDashboardLayout role="MENTOR" />
                </ProtectedRoute>
              }
            >
              <Route index element={<MentorDashboard />} />
            </Route>

            {/* Library / Librarian */}
            <Route
              path="/library"
              element={
                <ProtectedRoute allowedRoles={["LIBRARY", "LIBRARIAN"]}>
                  <RoleDashboardLayout role="LIBRARY" />
                </ProtectedRoute>
              }
            >
              <Route index element={<LibraryDashboard />} />
            </Route>

            {/* Admission */}
            <Route
              path="/admission"
              element={
                <ProtectedRoute allowedRoles={["ADMISSION"]}>
                  <RoleDashboardLayout role="ADMISSION" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdmissionDashboard />} />
            </Route>

            {/* Examination Dept / Exam Controller */}
            <Route
              path="/examination-dept"
              element={
                <ProtectedRoute allowedRoles={["EXAMINATION", "EXAM_CONTROLLER"]}>
                  <RoleDashboardLayout role="EXAMINATION" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ExaminationDeptDashboard />} />
            </Route>

            {/* Finance / Accountant */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={["FINANCE", "ACCOUNTANT"]}>
                  <RoleDashboardLayout role="FINANCE" />
                </ProtectedRoute>
              }
            >
              <Route index element={<FinanceDashboard />} />
            </Route>

            {/* HR */}
            <Route
              path="/hr"
              element={
                <ProtectedRoute allowedRoles={["HR"]}>
                  <RoleDashboardLayout role="HR" />
                </ProtectedRoute>
              }
            >
              <Route index element={<HRDashboard />} />
            </Route>

            {/* Counselor */}
            <Route
              path="/counselor"
              element={
                <ProtectedRoute allowedRoles={["COUNSELOR"]}>
                  <RoleDashboardLayout role="COUNSELOR" />
                </ProtectedRoute>
              }
            >
              <Route index element={<CounselorDashboard />} />
            </Route>


            <Route path="*" element={<NotFound />} />

          </Routes>
          <AuthenticatedChatbot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
