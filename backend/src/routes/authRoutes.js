import express from "express";
import { registerTeacher, loginTeacher, studentJoin, getMe, adminCreateTeacher, listTeachers } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerTeacher); // สมัครครู/แอดมิน (ใช้ตอน setup ครั้งแรกเท่านั้น — แนะนำปิด/จำกัด IP ตอน deploy จริง)
router.post("/login", loginTeacher); // ครู/แอดมิน login
router.post("/student-join", studentJoin); // นักเรียนเข้าห้องด้วยรหัสห้อง
router.get("/me", requireAuth, getMe); // เช็ค session ปัจจุบัน

// เฉพาะแอดมิน — ใช้สร้างบัญชีครูหลังจาก setup ครั้งแรกแล้ว (ปลอดภัยกว่า /register แบบเปิด)
router.post("/admin/teachers", requireAuth, requireRole("admin"), adminCreateTeacher);
router.get("/admin/teachers", requireAuth, requireRole("admin"), listTeachers);

export default router;
