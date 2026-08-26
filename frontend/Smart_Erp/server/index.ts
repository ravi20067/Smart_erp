import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  loadClasses,
  loadSections,
  getStats,
  loadStudents,
  getAcademicYears,
  getTeachers,
  getAcademicClasses,
  createAcademicClass,
  deleteAcademicClass,
  createAcademicYear,
  createSection,
  assignTeacher,
  copyStructure,
  loadDevicesHandler,
  addDeviceHandler,
  updateDeviceHandler,
  deleteDeviceHandler,
  deleteStudentHandler,
  deleteTeacherHandler,
} from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Admin Student routes
  app.get("/api/admin/student/classes", loadClasses);
  app.get("/api/admin/student/sections", loadSections);
  app.get("/api/admin/student/stats", getStats);
  app.get("/api/admin/student/students", loadStudents);
  app.delete("/api/admin/student/delete/:id", deleteStudentHandler);

  // Admin Teacher routes
  app.delete("/api/admin/teacher/delete/:id", deleteTeacherHandler);

  // Admin Academic Management routes
  app.get("/api/admin/academic-years", getAcademicYears);
  app.post("/api/admin/academic-years", createAcademicYear);
  app.get("/api/admin/academic-years/teachers", getTeachers);
  app.get("/api/admin/academic-years/classes", getAcademicClasses);
  app.post("/api/admin/academic-years/classes", createAcademicClass);
  app.delete("/api/admin/academic-years/classes/:classId", deleteAcademicClass);
  app.post("/api/admin/academic-years/classes/:classId/sections", createSection);
  app.put("/api/admin/academic-years/sections/:sectionId/teacher", assignTeacher);
  app.post("/api/admin/academic-years/:academicYearId/copy-structure", copyStructure);

  // Admin Device routes
  app.get("/api/admin/device/get_devices", loadDevicesHandler);
  app.post("/api/admin/device/add", addDeviceHandler);
  app.put("/api/admin/device/:id", updateDeviceHandler);
  app.delete("/api/admin/device/:id", deleteDeviceHandler);

  return app;
}
