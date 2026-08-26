import { Request, Response, RequestHandler } from "express";

type Teacher = { id: number; name: string; subject?: string };
type Section = { id: number; name: string; classTeacher?: Teacher | null; studentCount: number; capacity: number; roomNumber?: string };
type SchoolClass = { id: number; name: string; displayOrder: number; isActive: boolean; academicYearId: number; sections: Section[] };
type AcademicYear = { id: number; name: string; startDate: string; endDate: string; current: boolean; active: boolean };

// Initial Mock data
const mockStudents = [
];

const initialAcademicYears: AcademicYear[] = [
  { id: 1, name: "2025 - 2026", startDate: "2025-04-01", endDate: "2026-03-31", current: true, active: true }
];

const initialTeachers: Teacher[] = [
  { id: 1, name: "Sarah Jenkins", subject: "Mathematics" },
  { id: 2, name: "Michael Vance", subject: "Science" },
  { id: 3, name: "Anita Roy", subject: "English" },
  { id: 4, name: "David Miller", subject: "Physics" },
];


let schoolClassesStore: SchoolClass[] = [
];

export const loadClasses: RequestHandler = (_req: Request, res: Response) => {
  const classNames = schoolClassesStore.map(c => c.name);
  res.json(classNames);
};

export const loadSections: RequestHandler = (req: Request, res: Response) => {
  const cls = (req.query.class as string) || "";
  const found = schoolClassesStore.find(
    c => c.name === cls || c.name === `CLASS_${cls}` || c.name.replace("CLASS_", "") === cls
  );
  if (found && found.sections.length > 0) {
    return res.json(found.sections.map(s => s.name));
  }
  res.json([]);
};

export const getStats: RequestHandler = (_req: Request, res: Response) => {
  const totalStudents = mockStudents.length;
  const boys = mockStudents.filter(s => s.gender === 'MALE').length;
  const girls = mockStudents.filter(s => s.gender === 'FEMALE').length;
  const newStudent = mockStudents.filter(s => s.admissionNo === 'PENDING' || s.admissionNo === '').length;
  res.json({ totalStudents, boys, girls, newStudent });
};

export const loadStudents: RequestHandler = (req: Request, res: Response) => {
  const search = (req.query.search as string) || "";
  const className = (req.query.class as string) || "";
  const section = (req.query.section as string) || "";

  const filtered = mockStudents.filter((s) => {
    const matchesSearch =
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.includes(search);
    const matchesClass = className ? s.schoolClass.replace("CLASS_", "") === className || s.schoolClass === className : true;
    const matchesSection = section ? s.section === section : true;
    return matchesSearch && matchesClass && matchesSection;
  });

  res.json(filtered);
};

// Academic Management Endpoints
export const getAcademicYears: RequestHandler = (_req: Request, res: Response) => {
  res.json(initialAcademicYears);
};

export const getTeachers: RequestHandler = (_req: Request, res: Response) => {
  res.json(initialTeachers);
};

export const getAcademicClasses: RequestHandler = (req: Request, res: Response) => {
  const yearId = Number(req.query.academicYearId);
  if (yearId) {
    res.json(schoolClassesStore.filter(c => c.academicYearId === yearId));
  } else {
    res.json(schoolClassesStore);
  }
};

export const createAcademicClass: RequestHandler = (req: Request, res: Response) => {
  const { name, displayOrder, academicYearId } = req.body;
  const newClass: SchoolClass = {
    id: Date.now(),
    name: name || "NEW CLASS",
    displayOrder: displayOrder || schoolClassesStore.length + 1,
    isActive: true,
    academicYearId: academicYearId || 1,
    sections: []
  };
  schoolClassesStore.push(newClass);
  res.json(newClass);
};

export const deleteAcademicClass: RequestHandler = (req: Request, res: Response) => {
  const classId = Number(req.params.classId);
  schoolClassesStore = schoolClassesStore.filter(c => c.id !== classId);
  res.json({ success: true });
};

export const createAcademicYear: RequestHandler = (req: Request, res: Response) => {
  const newYear: AcademicYear = {
    id: Date.now(),
    name: req.body.name || "New Year",
    startDate: req.body.startDate || "",
    endDate: req.body.endDate || "",
    current: false,
    active: true
  };
  initialAcademicYears.push(newYear);
  res.json(newYear);
};

export const createSection: RequestHandler = (req: Request, res: Response) => {
  const classId = Number(req.params.classId);
  const cls = schoolClassesStore.find(c => c.id === classId);
  if (cls) {
    const newSection: Section = {
      id: Date.now(),
      name: req.body.name || "A",
      roomNumber: req.body.roomNumber || "",
      capacity: req.body.capacity || 40,
      studentCount: 0,
      classTeacher: null
    };
    cls.sections.push(newSection);
    return res.json(newSection);
  }
  res.status(404).json({ error: "Class not found" });
};

export const assignTeacher: RequestHandler = (req: Request, res: Response) => {
  const sectionId = Number(req.params.sectionId);
  const teacherId = Number(req.body.teacherId);
  const teacher = initialTeachers.find(t => t.id === teacherId) || null;

  for (const cls of schoolClassesStore) {
    const sec = cls.sections.find(s => s.id === sectionId);
    if (sec) {
      sec.classTeacher = teacher;
      return res.json(sec);
    }
  }
  res.status(404).json({ error: "Section not found" });
};

export const copyStructure: RequestHandler = (_req: Request, res: Response) => {
  res.json({ success: true });
};

// Admin Device handlers
let mockDevices: any[] = [
  { id: 1, deviceEPid: "DEV-1001", location: "Main Gate", password: "••••••••", status: "Active" },
  { id: 2, deviceEPid: "DEV-1002", location: "Library Entrance", password: "••••••••", status: "Active" },
  { id: 3, deviceEPid: "DEV-1003", location: "Science Block", password: "••••••••", status: "Inactive" }
];

export const loadDevicesHandler: RequestHandler = (_req: Request, res: Response) => {
  res.json(mockDevices);
};

export const addDeviceHandler: RequestHandler = (req: Request, res: Response) => {
  const { location, password } = req.body;
  const newDevice = {
    id: Date.now(),
    deviceEPid: `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
    location: location || "Unassigned",
    password: password || "123456",
    status: "Active"
  };
  mockDevices.push(newDevice);
  res.json(newDevice);
};

export const updateDeviceHandler: RequestHandler = (req: Request, res: Response) => {
  const id = Number(req.params.id) || req.params.id;
  const { location, password } = req.body;
  const device = mockDevices.find(d => d.id == id);
  if (device) {
    if (location !== undefined) device.location = location;
    if (password !== undefined) device.password = password;
    return res.json(device);
  }
  res.status(404).json({ message: "Device not found" });
};

export const deleteDeviceHandler: RequestHandler = (req: Request, res: Response) => {
  const id = Number(req.params.id) || req.params.id;
  mockDevices = mockDevices.filter(d => d.id != id);
  res.json({ success: true, message: "Device deleted" });
};

export const deleteStudentHandler: RequestHandler = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = mockStudents.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockStudents.splice(index, 1);
    return res.json({ success: true, message: "Student deleted" });
  }
  res.status(404).json({ message: "Student not found" });
};

export const deleteTeacherHandler: RequestHandler = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = initialTeachers.findIndex((t) => t.id === id);
  if (index !== -1) {
    initialTeachers.splice(index, 1);
    return res.json({ success: true, message: "Teacher deleted" });
  }
  res.status(404).json({ message: "Teacher not found" });
};
