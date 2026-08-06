import express from "express";
import {
  createAssignment,
  listAssignmentsByUnit,
  listAssignmentsForStudent,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// นักเรียนดูรายการงานของห้องตัวเอง
router.get("/my", requireAuth, requireRole("student"), listAssignmentsForStudent);

// ดูงานเดี่ยว — ใช้ได้ทั้งครูและนักเรียน (ตรวจสิทธิ์ในตัว controller)
router.get("/:id", requireAuth, getAssignment);

// ที่เหลือ เฉพาะครู/แอดมิน
router.use(requireAuth, requireRole("teacher", "admin"));
router.post("/", createAssignment);
router.get("/unit/:unitId", listAssignmentsByUnit);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
