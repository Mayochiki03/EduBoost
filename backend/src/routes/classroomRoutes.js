import express from "express";
import {
  createClassroom,
  listClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
  listStudentsInClassroom,
} from "../controllers/classroomController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ทุก endpoint ในนี้ต้อง login เป็นครู/แอดมินเท่านั้น (นักเรียนไม่เข้าหน้านี้)
router.use(requireAuth, requireRole("teacher", "admin"));

router.post("/", createClassroom);
router.get("/", listClassrooms);
router.get("/:id", getClassroom);
router.put("/:id", updateClassroom);
router.delete("/:id", deleteClassroom);
router.get("/:id/students", listStudentsInClassroom);

export default router;
