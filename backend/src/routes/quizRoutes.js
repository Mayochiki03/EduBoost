import express from "express";
import {
  createQuiz,
  uploadQuestionImage,
  listQuizzesByUnit,
  getQuizForTeacher,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quizController.js";
import {
  listQuizzesForStudent,
  getQuizForAttempt,
  submitQuizAttempt,
  getMyAttempts,
  listAttemptsForTeacher,
} from "../controllers/quizAttemptController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// นักเรียน
router.get("/my", requireAuth, requireRole("student"), listQuizzesForStudent);
router.get("/:id/attempt", requireAuth, requireRole("student"), getQuizForAttempt);
router.post("/:id/attempt", requireAuth, requireRole("student"), submitQuizAttempt);
router.get("/:id/my-attempts", requireAuth, requireRole("student"), getMyAttempts);

// ครู/แอดมิน
router.post("/", requireAuth, requireRole("teacher", "admin"), createQuiz);
router.post("/upload-question-image", requireAuth, requireRole("teacher", "admin"), uploadQuestionImage);
router.get("/unit/:unitId", requireAuth, requireRole("teacher", "admin"), listQuizzesByUnit);
router.get("/:id", requireAuth, requireRole("teacher", "admin"), getQuizForTeacher);
router.put("/:id", requireAuth, requireRole("teacher", "admin"), updateQuiz);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteQuiz);
router.get("/:id/results", requireAuth, requireRole("teacher", "admin"), listAttemptsForTeacher);

export default router;
