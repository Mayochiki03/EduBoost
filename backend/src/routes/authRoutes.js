import express from "express";
import { registerTeacher, loginTeacher, studentJoin, getMe, adminCreateTeacher, listTeachers, getClassroomRoster } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerTeacher); // สมัครครู/แอดมิน (ใช้ตอน setup ครั้งแรกเท่านั้น — แนะนำปิด/จำกัด IP ตอน deploy จริง)
router.post("/login", loginTeacher); // ครู/แอดมิน login (รองรับทั้งอีเมลและ username)
router.get("/classroom-roster/:joinCode", getClassroomRoster); // นักเรียนดูรายชื่อที่เคยเข้าห้องนี้ ก่อนเลือกชื่อตัวเอง
router.post("/student-join", studentJoin); // นักเรียนเข้าห้อง (เลือกจากรายชื่อ หรือสมัครใหม่)
router.get("/me", requireAuth, getMe); // เช็ค session ปัจจุบัน

// เฉพาะแอดมิน — ใช้สร้างบัญชีครูหลังจาก setup ครั้งแรกแล้ว (ปลอดภัยกว่า /register แบบเปิด)
router.post("/admin/teachers", requireAuth, requireRole("admin"), adminCreateTeacher);
router.get("/admin/teachers", requireAuth, requireRole("admin"), listTeachers);

export default router;
