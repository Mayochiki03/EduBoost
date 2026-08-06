import Quiz from "../models/Quiz.js";
import Unit from "../models/Unit.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { getOwnedClassroom } from "./unitController.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const QUESTION_TYPES = ["multiple_choice", "checkbox", "true_false", "short_answer"];

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw badRequest("ต้องมีคำถามอย่างน้อย 1 ข้อ");
  }
  for (const q of questions) {
    if (!QUESTION_TYPES.includes(q.type)) throw badRequest(`ชนิดคำถามไม่ถูกต้อง: ${q.type}`);
    if (!q.questionText) throw badRequest("กรุณากรอกคำถามให้ครบทุกข้อ");
    if ((q.type === "multiple_choice" || q.type === "checkbox") && (!q.options || q.options.length < 2)) {
      throw badRequest("ข้อแบบเลือกตอบต้องมีตัวเลือกอย่างน้อย 2 ข้อ");
    }
    if (!q.correctAnswers || q.correctAnswers.length === 0) {
      throw badRequest("กรุณาระบุเฉลยของทุกข้อ");
    }
  }
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// ครูสร้าง quiz พร้อมชุดคำถามทั้งหมดในครั้งเดียว (ส่ง questions เป็น JSON array)
export async function createQuiz(req, res) {
  try {
    const { unitId, title, questions, dueDate, attemptsAllowed, showAnswersAfterSubmit } = req.body;
    if (!unitId || !title) return res.status(400).json({ message: "กรุณาระบุหน่วยและชื่อ quiz" });

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const parsedQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
    validateQuestions(parsedQuestions);

    const quiz = await Quiz.create({
      title,
      unit: unitId,
      classroom: unit.classroom,
      questions: parsedQuestions,
      dueDate: dueDate || null,
      attemptsAllowed: attemptsAllowed || 1,
      showAnswersAfterSubmit: showAnswersAfterSubmit !== undefined ? showAnswersAfterSubmit : true,
      isPublished: false, // ครูต้องกดเผยแพร่เองอีกที กันสร้างเสร็จแล้วนักเรียนเห็นก่อนพร้อม
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "สร้าง quiz ไม่สำเร็จ" });
  }
}

// อัปโหลดรูปประกอบคำถามแยกต่างหาก (เรียกก่อนสร้าง/ตอนแก้ไข quiz แล้วเอา url ไปใส่ใน question.imageUrl ฝั่ง frontend)
export async function uploadQuestionImage(req, res) {
  try {
    if (!req.files?.image) return res.status(400).json({ message: "ไม่พบไฟล์รูป" });
    const uploaded = await uploadToCloudinary(req.files.image.tempFilePath, "quiz-questions");
    res.json({ url: uploaded.url });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดรูปไม่สำเร็จ", error: err.message });
  }
}

export async function listQuizzesByUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const quizzes = await Quiz.find({ unit: unit._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูล quiz ไม่สำเร็จ" });
  }
}

// ครูดู quiz พร้อมเฉลยเต็ม (ใช้ตอนแก้ไข)
export async function getQuizForTeacher(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "ไม่พบ quiz" });
    await getOwnedClassroom(req, quiz.classroom);
    res.json(quiz);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "เกิดข้อผิดพลาด" });
  }
}

export async function updateQuiz(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "ไม่พบ quiz" });
    await getOwnedClassroom(req, quiz.classroom);

    const { title, questions, dueDate, attemptsAllowed, showAnswersAfterSubmit, isPublished } = req.body;
    if (title !== undefined) quiz.title = title;
    if (questions !== undefined) {
      const parsed = typeof questions === "string" ? JSON.parse(questions) : questions;
      validateQuestions(parsed);
      quiz.questions = parsed;
    }
    if (dueDate !== undefined) quiz.dueDate = dueDate;
    if (attemptsAllowed !== undefined) quiz.attemptsAllowed = attemptsAllowed;
    if (showAnswersAfterSubmit !== undefined) quiz.showAnswersAfterSubmit = showAnswersAfterSubmit;
    if (isPublished !== undefined) quiz.isPublished = isPublished;

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "แก้ไข quiz ไม่สำเร็จ" });
  }
}

export async function deleteQuiz(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "ไม่พบ quiz" });
    await getOwnedClassroom(req, quiz.classroom);

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ message: "ลบ quiz เรียบร้อย" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ลบ quiz ไม่สำเร็จ" });
  }
}
