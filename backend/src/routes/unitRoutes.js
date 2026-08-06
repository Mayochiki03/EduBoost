import express from "express";
import { createUnit, listUnitsByClassroom, updateUnit, deleteUnit } from "../controllers/unitController.js";
import {
  getLeaderboardForTeacher,
  getLeaderboardForStudent,
  exportUnitToSheets,
} from "../controllers/rankingController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// นักเรียนดูอันดับของหน่วยตัวเอง (ต้องมาก่อน .use requireRole teacher/admin ด้านล่าง)
router.get("/:unitId/leaderboard/student", requireAuth, requireRole("student"), getLeaderboardForStudent);

router.use(requireAuth, requireRole("teacher", "admin"));

router.post("/", createUnit);
router.get("/classroom/:classroomId", listUnitsByClassroom);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);
router.get("/:unitId/leaderboard", getLeaderboardForTeacher);
router.post("/:unitId/export-sheets", exportUnitToSheets);

export default router;
