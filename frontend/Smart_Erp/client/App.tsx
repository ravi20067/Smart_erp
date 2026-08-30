import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Admissions from "./pages/Admissions";
import Apply from "./pages/Apply";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/student/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import LibraryDashboard from "./pages/library/Dashboard";
import AdmissionDashboard from "./pages/admission/Dashboard";
import ExaminationDeptDashboard from "./pages/examination_department/Dashboard";
import FinanceDashboard from "./pages/finance/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import AttendenceAuthenticator from "./pages/teacher/AttendenceAuthenticator";
import DeviceDashboard from "./pages/Devices/dashboard";
import University from './pages/admin/University';
import School from './pages/admin/School';
import Department from "./pages/admin/Department";

import { AuthProvider } from "@/services/authContext";
import ProtectedRoute from "@/services/protectedRoute";

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
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/test" element={<Department />} />

            {/* Protected Routes */}

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="universities" element={<University />} />
              <Route path="schools" element={<School />} />
              <Route path="departments" element={<Department />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["ROLE_STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute allowedRoles={["ROLE_DEVICES"]}>
                  <DeviceDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["ROLE_TEACHER"]}>
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
                <ProtectedRoute allowedRoles={["ROLE_LIBRARY"]}>
                  <LibraryDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admission"
              element={
                <ProtectedRoute allowedRoles={["ROLE_ADMISSION"]}>
                  <AdmissionDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/examination-dept"
              element={
                <ProtectedRoute allowedRoles={["ROLE_EXAMINATION"]}>
                  <ExaminationDeptDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={["ROLE_FINANCE"]}>
                  <FinanceDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
