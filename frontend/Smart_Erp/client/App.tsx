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
import Solutions from "./pages/Solutions";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/student/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import LibraryDashboard from "./pages/library/Dashboard";
import AdmissionDashboard from "./pages/admission/Dashboard";
import ExaminationDeptDashboard from "./pages/examination_department/Dashboard";
import FinanceDashboard from "./pages/finance/Dashboard";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminLayout from "./pages/super-admin/Layout";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import AttendenceAuthenticator from "./pages/teacher/AttendenceAuthenticator";
import DeviceDashboard from "./pages/Devices/dashboard";

import { AuthProvider } from "@/services/authContext";
import ProtectedRoute from "@/services/protectedRoute";
import Blog from "./pages/Blog";
import BookDemo from "./pages/BookDemo";
import University from "./pages/organisation/University";
import School from "./pages/organisation/School";

const queryClient = new QueryClient();

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
              <Route index element={<School />} />
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
              {/* <Route path="departments" element={<Department />} /> */}

              {/* Add your other existing admin routes here */}
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

              {/* Organization */}
              {/* <Route path="universities" element={<University />} />
              <Route path="schools" element={<School />} />
              <Route path="departments" element={<Department />} /> */}

              {/* Add your other existing admin routes here */}
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute allowedRoles={["DEVICES"]}>
                  <DeviceDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["TEACHER"]}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="attendance-authenticator" element={<AttendenceAuthenticator />} />
            </Route>

            <Route
              path="/library"
              element={
                <ProtectedRoute allowedRoles={["LIBRARY"]}>
                  <LibraryDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admission"
              element={
                <ProtectedRoute allowedRoles={["ADMISSION"]}>
                  <AdmissionDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/examination-dept"
              element={
                <ProtectedRoute allowedRoles={["EXAMINATION"]}>
                  <ExaminationDeptDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={["FINANCE"]}>
                  <FinanceDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />

          </Routes>
          <SmartERPChatbot
            title="Smart ERP AI"
            subtitle="Your multilingual assistant"
          />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
