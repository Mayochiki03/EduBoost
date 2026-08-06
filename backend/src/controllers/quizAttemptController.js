import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { getOwnedClassroom } from "./unitController.js";

// นักเรียนดู quiz ที่เผยแพร่แล้วทั้งหมดในห้องตัวเอง พร้อมสถานะว่าทำไปแล้วกี่ครั้ง
export async function listQuizzesForStudent(req, res) {
  try {
    const quizzes = await Quiz.find({ classroom: req.user.classroomId, isPublished: true })
      .select("title unit dueDate attemptsAllowed questions createdAt")
      .populate("unit", "title order")
      .sort({ createdAt: -1 });

    const myAttempts = await QuizAttempt.find({ student: req.user.id }).select(
      "quiz totalScore maxScore attemptNumber submittedAt"
    );

    const result = quizzes.map((q) => {
      const attempts = myAttempts.filter((a) => String(a.quiz) === String(q._id));
      return {
        id: q._id,
        title: q.title,
        unit: q.unit,
        dueDate: q.dueDate,
        attemptsAllowed: q.attemptsAllowed,
        questionCount: q.questions.length,
        attemptsUsed: attempts.length,
        bestScore: attempts.length ? Math.max(...attempts.map((a) => a.totalScore)) : null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูล quiz ไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนเปิด quiz เพื่อเริ่มทำ — ต้องซ่อนเฉลย (correctAnswers) ออกจากคำถามก่อนส่งให้ frontend
export async function getQuizForAttempt(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isPublished) return res.status(404).json({ message: "ไม่พบ quiz นี้" });
    if (String(quiz.classroom) !== String(req.user.classroomId)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง quiz นี้" });
    }

    const attemptsUsed = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user.id });
    if (attemptsUsed >= quiz.attemptsAllowed) {
      return res.status(403).json({ message: "ทำครบจำนวนครั้งที่กำหนดแล้ว" });
    }

    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      type: q.type,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
      timeLimitSeconds: q.timeLimitSeconds,
      // correctAnswers ตั้งใจไม่ส่งมาตรงนี้ กันนักเรียนเปิด devtools ดูเฉลย
    }));

    res.json({
      id: quiz._id,
      title: quiz.title,
      dueDate: quiz.dueDate,
      attemptsAllowed: quiz.attemptsAllowed,
      attemptsUsed,
      questions: safeQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: "เปิด quiz ไม่สำเร็จ", error: err.message });
  }
}

// ตรวจคำตอบอัตโนมัติทีละชนิดคำถาม คืนค่า { isCorrect, pointsEarned }
function gradeAnswer(question, submittedAnswer) {
  const points = question.points || 1;

  if (question.type === "multiple_choice" || question.type === "true_false") {
    // correctAnswers[0] คือ index ของตัวเลือกที่ถูก
    const isCorrect = Number(submittedAnswer) === Number(question.correctAnswers[0]);
    return { isCorrect, pointsEarned: isCorrect ? points : 0 };
  }

  if (question.type === "checkbox") {
    // ต้องตอบถูกครบทุกข้อ และไม่เกินที่เฉลยไว้ ถึงจะได้คะแนนเต็ม
    const submitted = Array.isArray(submittedAnswer) ? submittedAnswer.map(Number).sort() : [];
    const correct = question.correctAnswers.map(Number).sort();
    const isCorrect = submitted.length === correct.length && submitted.every((v, i) => v === correct[i]);
    return { isCorrect, pointsEarned: isCorrect ? points : 0 };
  }

  if (question.type === "short_answer") {
    // เทียบแบบ case-insensitive + ตัดช่องว่างหน้าหลัง ยอมรับเฉลยได้หลายแบบ (correctAnswers เป็น array ของคำตอบที่ยอมรับ)
    const normalize = (s) => String(s || "").trim().toLowerCase();
    const submitted = normalize(submittedAnswer);
    const isCorrect = question.correctAnswers.some((ans) => normalize(ans) === submitted);
    return { isCorrect, pointsEarned: isCorrect ? points : 0 };
  }

  return { isCorrect: false, pointsEarned: 0 };
}

// นักเรียนส่งคำตอบทั้งชุด — ตรวจให้คะแนนทันทีอัตโนมัติ ไม่ต้องรอครู
export async function submitQuizAttempt(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isPublished) return res.status(404).json({ message: "ไม่พบ quiz นี้" });
    if (String(quiz.classroom) !== String(req.user.classroomId)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ทำ quiz นี้" });
    }

    const attemptsUsed = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user.id });
    if (attemptsUsed >= quiz.attemptsAllowed) {
      return res.status(403).json({ message: "ทำครบจำนวนครั้งที่กำหนดแล้ว" });
    }

    // answers: [{ questionIndex, answer }]
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ message: "รูปแบบคำตอบไม่ถูกต้อง" });

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = quiz.questions.map((question, index) => {
      maxScore += question.points || 1;
      const submitted = answers.find((a) => a.questionIndex === index);
      const { isCorrect, pointsEarned } = gradeAnswer(question, submitted?.answer);
      totalScore += pointsEarned;
      return {
        questionIndex: index,
        answer: submitted?.answer ?? null,
        isCorrect,
        pointsEarned,
      };
    });

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user.id,
      answers: gradedAnswers,
      totalScore,
      maxScore,
      submittedAt: new Date(),
      attemptNumber: attemptsUsed + 1,
    });

    // ถ้าไม่ให้ดูเฉลยหลังส่ง ก็ซ่อน isCorrect/pointsEarned รายข้อ เหลือแค่คะแนนรวม
    if (!quiz.showAnswersAfterSubmit) {
      return res.status(201).json({
        id: attempt._id,
        totalScore,
        maxScore,
        attemptNumber: attempt.attemptNumber,
      });
    }

    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ message: "ส่งคำตอบไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนดูประวัติการทำ quiz ของตัวเอง
export async function getMyAttempts(req, res) {
  try {
    const attempts = await QuizAttempt.find({ quiz: req.params.id, student: req.user.id }).sort({
      attemptNumber: 1,
    });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ", error: err.message });
  }
}

// ครูดูผลของนักเรียนทุกคนใน quiz หนึ่งชุด (ใช้ตัดเกรด/ดูภาพรวม)
export async function listAttemptsForTeacher(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "ไม่พบ quiz" });

    await getOwnedClassroom(req, quiz.classroom);

    const attempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate("student", "name studentId")
      .sort({ totalScore: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูลไม่สำเร็จ" });
  }
}
