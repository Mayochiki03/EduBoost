import User from "../models/User.js";
import Student from "../models/Student.js";
import Classroom from "../models/Classroom.js";
import { hashPassword, comparePassword, signToken } from "../utils/authUtils.js";

// ครู/แอดมิน สมัครบัญชี (ปกติแอดมินจะเป็นคนสร้างบัญชีครูให้ผ่านหน้า admin
// แต่เปิด endpoint นี้ไว้เผื่อ setup ครั้งแรก / ใช้ seed script แทนได้)
export async function registerTeacher(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "teacher",
    });

    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ", error: err.message });
  }
}

export async function loginTeacher(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
    const token = signToken({ id: user._id, role: user.role });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "เข้าสู่ระบบไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนเข้าห้องเรียนด้วยรหัสห้อง + เลือกชื่อตัวเองจาก roster หรือกรอกใหม่ + รหัสนักเรียน
// ไม่มีรหัสผ่าน ออกแบบให้ session อายุยาว (30 วัน) เพราะเด็กจะ login ทิ้งไว้ในเครื่อง/แท็บเล็ตของห้อง
export async function studentJoin(req, res) {
  try {
    const { joinCode, name, studentId } = req.body;
    if (!joinCode || !name || !studentId) {
      return res.status(400).json({ message: "กรุณากรอกรหัสห้อง ชื่อ และรหัสนักเรียนให้ครบ" });
    }

    const classroom = await Classroom.findOne({ joinCode, archived: false });
    if (!classroom) {
      return res.status(404).json({ message: "ไม่พบห้องเรียนนี้ ตรวจสอบรหัสห้องอีกครั้ง" });
    }

    // หานักเรียนเดิม (เคยเข้าห้องนี้มาก่อนด้วย studentId เดียวกัน) หรือสร้างใหม่
    let student = await Student.findOne({ studentId, classroom: classroom._id });
    if (!student) {
      student = await Student.create({ name, studentId, classroom: classroom._id });
    }

    const token = signToken({ id: student._id, role: "student", classroomId: classroom._id });
    res.json({
      token,
      student: { id: student._id, name: student.name, studentId: student.studentId },
      classroom: {
        id: classroom._id,
        subjectName: classroom.subjectName,
        gradeLevel: classroom.gradeLevel,
        coverColor: classroom.coverColor,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "เข้าห้องเรียนไม่สำเร็จ", error: err.message });
  }
}

// แอดมินสร้างบัญชีครูให้ (ต้อง login เป็นแอดมินก่อนถึงจะเรียกได้ — ปลอดภัยกว่า endpoint register แบบเปิดเผย)
export async function adminCreateTeacher(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "teacher",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "สร้างบัญชีไม่สำเร็จ", error: err.message });
  }
}

// แอดมินดูรายชื่อครู/แอดมินทั้งหมดในระบบ
export async function listTeachers(req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ", error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    if (req.user.role === "student") {
      const student = await Student.findById(req.user.id).populate("classroom");
      if (!student) return res.status(404).json({ message: "ไม่พบนักเรียน" });
      return res.json({ role: "student", student, classroom: student.classroom });
    }
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json({ role: user.role, user });
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ", error: err.message });
  }
}
