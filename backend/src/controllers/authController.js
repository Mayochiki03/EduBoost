import User from "../models/User.js";
import Student from "../models/Student.js";
import Classroom from "../models/Classroom.js";
import { hashPassword, comparePassword, signToken } from "../utils/authUtils.js";

// ครู/แอดมิน สมัครบัญชี (ปกติแอดมินจะเป็นคนสร้างบัญชีครูให้ผ่านหน้า admin
// แต่เปิด endpoint นี้ไว้เผื่อ setup ครั้งแรก / ใช้ seed script แทนได้)
export async function registerTeacher(req, res) {
  try {
    const { name, email, username, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    if (username) {
      const usernameTaken = await User.findOne({ username: username.toLowerCase() });
      if (usernameTaken) return res.status(409).json({ message: "username นี้ถูกใช้งานแล้ว" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username ? username.toLowerCase() : undefined,
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "teacher",
    });

    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ", error: err.message });
  }
}

// รองรับ login ด้วยอีเมล "หรือ" username อย่างใดอย่างหนึ่ง — พิมพ์ username สั้นๆ แทนอีเมลยาวๆ ได้เลย
export async function loginTeacher(req, res) {
  try {
    const { email, username, identifier, password } = req.body;
    // รับได้ทั้ง field "identifier" (แนะนำ ใช้กับฟอร์มใหม่ที่มีช่องเดียว) หรือ "email"/"username" แยก (เผื่อของเดิมยังส่งมา)
    const raw = (identifier || email || username || "").trim().toLowerCase();
    if (!raw) return res.status(400).json({ message: "กรุณากรอกอีเมลหรือ username" });

    const user = await User.findOne({ $or: [{ email: raw }, { username: raw }] });
    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ message: "อีเมล/username หรือรหัสผ่านไม่ถูกต้อง" });
    }
    const token = signToken({ id: user._id, role: user.role });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "เข้าสู่ระบบไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนดูรายชื่อที่เคยเข้าห้องนี้แล้ว (ใช้เลือกชื่อตัวเองแทนการพิมพ์ใหม่ทุกครั้ง กันพิมพ์ผิดจนได้บัญชีซ้ำ)
// endpoint นี้เปิดเผยได้ (ไม่ต้อง login) เพราะต้องใช้ก่อนเข้าห้องเรียน แต่ต้องรู้ joinCode ที่ถูกต้องก่อนถึงจะเห็นรายชื่อ
export async function getClassroomRoster(req, res) {
  try {
    const { joinCode } = req.params;
    const classroom = await Classroom.findOne({ joinCode, archived: false });
    if (!classroom) return res.status(404).json({ message: "ไม่พบห้องเรียนนี้ ตรวจสอบรหัสห้องอีกครั้ง" });

    const students = await Student.find({ classroom: classroom._id })
      .select("name studentId")
      .sort({ name: 1 });

    res.json({
      classroom: { subjectName: classroom.subjectName, gradeLevel: classroom.gradeLevel, coverColor: classroom.coverColor },
      students,
    });
  } catch (err) {
    res.status(500).json({ message: "ดึงรายชื่อไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนเข้าห้องเรียน มี 2 โหมด:
// โหมด "เคยเข้าห้องนี้แล้ว" — ส่ง studentRecordId ที่เลือกจากรายชื่อ (getClassroomRoster) มาตรงๆ ไม่มีการพิมพ์ใหม่ = ไม่มีทางพิมพ์ผิด
// โหมด "ยังไม่เคยเข้าห้องนี้" — ส่ง name + studentId มาสร้างบัญชีใหม่ (มีเช็คชื่อ+เลขที่ซ้ำก่อนสร้างกันสร้างซ้ำโดยไม่ตั้งใจ)
export async function studentJoin(req, res) {
  try {
    const { joinCode, studentRecordId, name, studentId } = req.body;
    if (!joinCode) {
      return res.status(400).json({ message: "กรุณากรอกรหัสห้องเรียน" });
    }

    const classroom = await Classroom.findOne({ joinCode, archived: false });
    if (!classroom) {
      return res.status(404).json({ message: "ไม่พบห้องเรียนนี้ ตรวจสอบรหัสห้องอีกครั้ง" });
    }

    let student;

    if (studentRecordId) {
      // โหมดเลือกชื่อจากรายชื่อเดิม — ไม่มีการพิมพ์เลย ปลอดภัยจากการพิมพ์ผิดโดยสมบูรณ์
      student = await Student.findOne({ _id: studentRecordId, classroom: classroom._id });
      if (!student) {
        return res.status(404).json({ message: "ไม่พบชื่อนี้ในห้องเรียน อาจถูกลบไปแล้ว ลองเลือกใหม่หรือสมัครบัญชีใหม่" });
      }
    } else {
      // โหมดสมัครใหม่ — ต้องกรอกทั้งชื่อและเลขที่
      if (!name || !studentId) {
        return res.status(400).json({ message: "กรุณากรอกชื่อและเลขประจำตัวนักเรียนให้ครบ" });
      }
      const existing = await Student.findOne({ studentId: studentId.trim(), classroom: classroom._id });
      if (existing) {
        return res.status(409).json({
          message: `มีเลขที่ ${studentId} อยู่ในห้องนี้แล้ว (ชื่อ "${existing.name}") ถ้าเป็นคุณ กรุณาเลือกชื่อจากรายชื่อแทนการสมัครใหม่`,
        });
      }
      student = await Student.create({ name: name.trim(), studentId: studentId.trim(), classroom: classroom._id });
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
    const { name, email, username, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    if (username) {
      const usernameTaken = await User.findOne({ username: username.toLowerCase() });
      if (usernameTaken) return res.status(409).json({ message: "username นี้ถูกใช้งานแล้ว" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username ? username.toLowerCase() : undefined,
      password: hashPassword(password),
      role: role === "admin" ? "admin" : "teacher",
    });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, username: user.username, role: user.role });
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
