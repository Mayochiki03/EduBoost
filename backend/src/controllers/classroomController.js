import Classroom from "../models/Classroom.js";
import Student from "../models/Student.js";
import Unit from "../models/Unit.js";
import { generateUniqueJoinCode } from "../utils/joinCode.js";

// ครูสร้างห้องเรียนใหม่
export async function createClassroom(req, res) {
  try {
    const { subjectName, gradeLevel, coverColor } = req.body;
    if (!subjectName || !gradeLevel) {
      return res.status(400).json({ message: "กรุณากรอกชื่อวิชาและระดับชั้น" });
    }
    const joinCode = await generateUniqueJoinCode(Classroom);
    const classroom = await Classroom.create({
      subjectName,
      gradeLevel,
      joinCode,
      coverColor: coverColor || "#3B82F6",
      teacher: req.user.id,
    });
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: "สร้างห้องเรียนไม่สำเร็จ", error: err.message });
  }
}

// ครูดูห้องเรียนของตัวเองทั้งหมด / แอดมินดูได้ทุกห้อง
export async function listClassrooms(req, res) {
  try {
    const filter = req.user.role === "admin" ? {} : { teacher: req.user.id };
    const classrooms = await Classroom.find(filter).populate("teacher", "name email").sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลห้องเรียนไม่สำเร็จ", error: err.message });
  }
}

export async function getClassroom(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id).populate("teacher", "name email");
    if (!classroom) return res.status(404).json({ message: "ไม่พบห้องเรียน" });
    await assertOwnerOrAdmin(req, classroom);
    const studentCount = await Student.countDocuments({ classroom: classroom._id });
    res.json({ ...classroom.toObject(), studentCount });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "เกิดข้อผิดพลาด" });
  }
}

export async function updateClassroom(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "ไม่พบห้องเรียน" });
    await assertOwnerOrAdmin(req, classroom);

    const { subjectName, gradeLevel, coverColor, lateSubmissionPolicy, archived } = req.body;
    if (subjectName !== undefined) classroom.subjectName = subjectName;
    if (gradeLevel !== undefined) classroom.gradeLevel = gradeLevel;
    if (coverColor !== undefined) classroom.coverColor = coverColor;
    if (lateSubmissionPolicy !== undefined) classroom.lateSubmissionPolicy = lateSubmissionPolicy;
    if (archived !== undefined) classroom.archived = archived;

    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "แก้ไขห้องเรียนไม่สำเร็จ" });
  }
}

export async function deleteClassroom(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "ไม่พบห้องเรียน" });
    await assertOwnerOrAdmin(req, classroom);

    await classroom.deleteOne();
    // ลบข้อมูลลูกที่ผูกกับห้องนี้ (นักเรียน, หน่วยการเรียน) — งาน/quiz ผูกกับ unit จะลบทีหลังผ่าน cascade ในเวอร์ชันถัดไป
    await Student.deleteMany({ classroom: classroom._id });
    await Unit.deleteMany({ classroom: classroom._id });

    res.json({ message: "ลบห้องเรียนเรียบร้อย" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ลบห้องเรียนไม่สำเร็จ" });
  }
}

// รายชื่อนักเรียนในห้อง (สำหรับหน้าจัดการนักเรียน)
export async function listStudentsInClassroom(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "ไม่พบห้องเรียน" });
    await assertOwnerOrAdmin(req, classroom);

    const students = await Student.find({ classroom: classroom._id }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงรายชื่อนักเรียนไม่สำเร็จ" });
  }
}

// helper: เฉพาะครูเจ้าของห้องหรือแอดมินเท่านั้นที่แก้ไข/ลบห้องได้
async function assertOwnerOrAdmin(req, classroom) {
  if (req.user.role === "admin") return;
  if (String(classroom.teacher) !== String(req.user.id)) {
    const err = new Error("ไม่มีสิทธิ์เข้าถึงห้องเรียนนี้");
    err.status = 403;
    throw err;
  }
}
