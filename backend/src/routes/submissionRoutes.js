import express from "express";
import {
  submitAssignment,
  getMySubmission,
  listSubmissionsForAssignment,
  gradeSubmission,
} from "../controllers/submissionController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// นักเรียน
router.post("/assignment/:assignmentId", requireAuth, requireRole("student"), submitAssignment);
router.get("/assignment/:assignmentId/mine", requireAuth, requireRole("student"), getMySubmission);

// ครู/แอดมิน
router.get(
  "/assignment/:assignmentId/all",
  requireAuth,
  requireRole("teacher", "admin"),
  listSubmissionsForAssignment
);
router.put("/:id/grade", requireAuth, requireRole("teacher", "admin"), gradeSubmission);

export default router;
