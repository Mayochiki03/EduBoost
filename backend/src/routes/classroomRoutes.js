import express from "express";
import {
  createClassroom,
  listClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
  listStudentsInClassroom,
  removeStudentFromClassroom,
  reorderClassrooms,
} from "../controllers/classroomController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ทุก endpoint ในนี้ต้อง login เป็นครู/แอดมินเท่านั้น (นักเรียนไม่เข้าหน้านี้)
router.use(requireAuth, requireRole("teacher", "admin"));

router.post("/", createClassroom);
router.get("/", listClassrooms);
router.put("/reorder", reorderClassrooms); // ต้องมาก่อน "/:id" กันชนกับ route param
router.get("/:id", getClassroom);
router.put("/:id", updateClassroom);
router.delete("/:id", deleteClassroom);
router.get("/:id/students", listStudentsInClassroom);
router.delete("/:id/students/:studentId", removeStudentFromClassroom);

export default router;
