import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Student from "../models/Student.js";

// จำนวนระดับการเติบโตของต้นไม้/การ์ตูน (0 = ยังไม่ส่งอะไรเลย, 10 = โตเต็มที่)
// ปรับเลขนี้ได้ตามจำนวนภาพที่แอดมินอัปโหลดจริงใน GrowthAsset (ตอนนี้ตั้งไว้ 10 ตามที่ขอ)
const GROWTH_STAGES = 10;

/**
 * คำนวณคะแนนรวม + อันดับ + ระดับการเติบโต ของนักเรียนทุกคนในหน่วยเดียว
 * คะแนนรวม = ผลรวมคะแนนงานที่ตรวจแล้ว (Submission.score) + ผลรวมคะแนน quiz ที่ดีที่สุดของแต่ละชุด (QuizAttempt.totalScore)
 * ระดับการเติบโต = สัดส่วนจำนวนงานที่ "ส่งแล้ว" (ไม่ว่าจะตรวจหรือยัง) เทียบกับจำนวนงานทั้งหมดในหน่วย เทียบเป็น 5 ระดับ
 */
export async function computeUnitScores(unitId) {
  const [assignments, quizzes] = await Promise.all([
    Assignment.find({ unit: unitId }).select("_id maxScore"),
    Quiz.find({ unit: unitId }).select("_id"),
  ]);
  const assignmentIds = assignments.map((a) => a._id);
  const quizIds = quizzes.map((q) => q._id);

  if (assignmentIds.length === 0 && quizIds.length === 0) return [];

  // ห้องเรียนของหน่วยนี้ ใช้หา studentList ทั้งหมด (รวมคนที่ยังไม่ส่งอะไรเลย ให้เห็นอันดับท้ายๆ ด้วย)
  const firstAssignment = assignments[0];
  const classroomId = firstAssignment
    ? (await Assignment.findById(firstAssignment._id)).classroom
    : (await Quiz.findById(quizzes[0]._id)).classroom;

  const students = await Student.find({ classroom: classroomId }).select("_id name studentId");

  const [submissions, attempts] = await Promise.all([
    Submission.find({ assignment: { $in: assignmentIds } }).select("student assignment score status"),
    QuizAttempt.find({ quiz: { $in: quizIds } }).select("student quiz totalScore"),
  ]);

  const scoreByStudent = new Map();
  const submittedCountByStudent = new Map();

  for (const student of students) {
    scoreByStudent.set(String(student._id), 0);
    submittedCountByStudent.set(String(student._id), 0);
  }

  // รวมคะแนนงานที่ตรวจแล้ว + นับจำนวนที่ส่ง (ไม่ว่าตรวจหรือยัง) สำหรับคำนวณการเติบโต
  for (const sub of submissions) {
    const key = String(sub.student);
    submittedCountByStudent.set(key, (submittedCountByStudent.get(key) || 0) + 1);
    if (sub.status === "graded" && typeof sub.score === "number") {
      scoreByStudent.set(key, (scoreByStudent.get(key) || 0) + sub.score);
    }
  }

  // รวมคะแนน quiz — ใช้คะแนนที่ดีที่สุดของแต่ละชุดต่อคน (ไม่ใช่รวมทุกครั้งที่ทำ)
  const bestQuizScore = new Map(); // key: studentId|quizId
  for (const attempt of attempts) {
    const key = `${attempt.student}|${attempt.quiz}`;
    const current = bestQuizScore.get(key) || 0;
    if (attempt.totalScore > current) bestQuizScore.set(key, attempt.totalScore);
  }
  for (const [key, score] of bestQuizScore.entries()) {
    const [studentId] = key.split("|");
    scoreByStudent.set(studentId, (scoreByStudent.get(studentId) || 0) + score);
  }

  const totalAssignments = assignmentIds.length;

  const leaderboard = students.map((student) => {
    const key = String(student._id);
    const submittedCount = submittedCountByStudent.get(key) || 0;
    const growthStage =
      totalAssignments === 0
        ? 0
        : Math.min(GROWTH_STAGES, Math.ceil((submittedCount / totalAssignments) * GROWTH_STAGES));

    return {
      studentId: student._id,
      name: student.name,
      studentNumber: student.studentId,
      score: Math.round((scoreByStudent.get(key) || 0) * 100) / 100,
      submittedCount,
      totalAssignments,
      growthStage,
    };
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}
