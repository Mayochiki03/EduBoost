// รัน: npm run seed:mock
// สร้างข้อมูลตัวอย่างทั้งชุดไว้เทสระบบได้ทันที: ครู 1 คน, ห้องเรียน 1 ห้อง, หน่วย, งาน, quiz, นักเรียน 5 คน,
// พร้อมงานที่ส่งแล้ว (ทั้งตรวจแล้ว/รอตรวจ/ส่งช้า) และผลการทำ quiz บางส่วน
// รันซ้ำได้ปลอดภัย — จะลบข้อมูล mock เดิม (ห้อง "วิทยาการคำนวณ (ตัวอย่าง)") ออกก่อนสร้างใหม่ทุกครั้ง ไม่กระทบห้องเรียนจริงอื่นๆ
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { hashPassword } from "./authUtils.js";

import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Student from "../models/Student.js";
import Unit from "../models/Unit.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";

const MOCK_SUBJECT_NAME = "วิทยาการคำนวณ (ตัวอย่าง)";
const MOCK_JOIN_CODE = "999999";

async function seedMockData() {
  await connectDB();

  console.log("🧹 ล้างข้อมูล mock เดิม (ถ้ามี)...");
  const oldClassroom = await Classroom.findOne({ subjectName: MOCK_SUBJECT_NAME });
  if (oldClassroom) {
    const oldUnits = await Unit.find({ classroom: oldClassroom._id });
    const unitIds = oldUnits.map((u) => u._id);
    const oldAssignments = await Assignment.find({ unit: { $in: unitIds } });
    const assignmentIds = oldAssignments.map((a) => a._id);
    const oldQuizzes = await Quiz.find({ unit: { $in: unitIds } });
    const quizIds = oldQuizzes.map((q) => q._id);

    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await QuizAttempt.deleteMany({ quiz: { $in: quizIds } });
    await Assignment.deleteMany({ unit: { $in: unitIds } });
    await Quiz.deleteMany({ unit: { $in: unitIds } });
    await Student.deleteMany({ classroom: oldClassroom._id });
    await Unit.deleteMany({ classroom: oldClassroom._id });
    await Classroom.deleteOne({ _id: oldClassroom._id });
  }

  // 1) ครูตัวอย่าง (ใช้บัญชีเดิมถ้ามีอยู่แล้ว ไม่สร้างซ้ำ)
  const teacherEmail = "teacher@test.com";
  let teacher = await User.findOne({ email: teacherEmail });
  if (!teacher) {
    teacher = await User.create({
      name: "ครูทดสอบ ใจดี",
      email: teacherEmail,
      password: hashPassword("test1234"),
      role: "teacher",
    });
    console.log(`✅ สร้างครูตัวอย่าง: ${teacherEmail} / รหัสผ่าน test1234`);
  } else {
    console.log(`ℹ️  ใช้บัญชีครูเดิมที่มีอยู่แล้ว: ${teacherEmail}`);
  }

  // 2) ห้องเรียนตัวอย่าง
  const classroom = await Classroom.create({
    subjectName: MOCK_SUBJECT_NAME,
    gradeLevel: "ม.1/1",
    joinCode: MOCK_JOIN_CODE,
    teacher: teacher._id,
    coverColor: "#3B6EF6",
    lateSubmissionPolicy: { type: "percentPerDay", value: 10 }, // หัก 10% ต่อวันที่ส่งช้า
  });
  console.log(`✅ สร้างห้องเรียน "${MOCK_SUBJECT_NAME}" รหัสห้อง: ${MOCK_JOIN_CODE}`);

  // 3) นักเรียนตัวอย่าง 5 คน
  const studentSeed = [
    { name: "สมชาย ใจดี", studentId: "10001" },
    { name: "สมหญิง รักเรียน", studentId: "10002" },
    { name: "วิชัย ขยันมาก", studentId: "10003" },
    { name: "มานี มีสุข", studentId: "10004" },
    { name: "ปิติ ยินดี", studentId: "10005" },
  ];
  const students = await Student.insertMany(
    studentSeed.map((s) => ({ ...s, classroom: classroom._id }))
  );
  console.log(`✅ สร้างนักเรียน ${students.length} คน (เลขที่ ${studentSeed.map((s) => s.studentId).join(", ")})`);

  // 4) หน่วยการเรียน
  const unit1 = await Unit.create({
    title: "หน่วยที่ 1: พื้นฐานการเขียนโปรแกรม",
    order: 0,
    classroom: classroom._id,
    rewardTiers: [
      { rank: 1, rewardLabel: "สติกเกอร์ทอง" },
      { rank: 2, rewardLabel: "สติกเกอร์เงิน" },
      { rank: 3, rewardLabel: "สติกเกอร์ทองแดง" },
    ],
  });
  console.log(`✅ สร้างหน่วยการเรียน: ${unit1.title}`);

  // 5) งาน 2 ชิ้น — ชิ้นแรกยังไม่ถึงกำหนดส่ง, ชิ้นที่สองเลยกำหนดแล้ว (ไว้เทสเคสส่งช้า)
  const now = new Date();
  const future = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // อีก 5 วัน
  const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // ผ่านมาแล้ว 3 วัน

  const assignment1 = await Assignment.create({
    title: "ใบงานที่ 1: เขียน Flowchart",
    description: "วาด Flowchart แสดงขั้นตอนการต้มมาม่า อัปโหลดเป็นรูปหรือ PDF",
    unit: unit1._id,
    classroom: classroom._id,
    maxScore: 10,
    dueDate: future,
  });
  const assignment2 = await Assignment.create({
    title: "ใบงานที่ 2: โปรเจกต์ Scratch",
    description: "สร้างเกมง่ายๆ ด้วย Scratch แล้วส่งลิงก์โปรเจกต์",
    unit: unit1._id,
    classroom: classroom._id,
    maxScore: 20,
    dueDate: past,
  });
  console.log(`✅ สร้างงาน 2 ชิ้น: "${assignment1.title}" (ยังไม่ถึงกำหนด), "${assignment2.title}" (เลยกำหนดแล้ว)`);

  // 6) จำลองการส่งงาน — ใช้ "link" แทนไฟล์จริง เพื่อไม่ต้องพึ่ง Cloudinary ตอนสร้าง mock data
  await Submission.create([
    {
      assignment: assignment1._id,
      student: students[0]._id, // สมชาย: ส่งตรงเวลา ตรวจแล้ว
      link: "https://example.com/flowchart-somchai.png",
      note: "ส่งงานแล้วครับ",
      submittedAt: now,
      isLate: false,
      status: "graded",
      score: 9,
      teacherComment: "ทำได้ดีมาก ลูกศรชัดเจน",
      gradedAt: now,
    },
    {
      assignment: assignment1._id,
      student: students[1]._id, // สมหญิง: ส่งตรงเวลา รอตรวจ
      link: "https://example.com/flowchart-somying.png",
      submittedAt: now,
      isLate: false,
      status: "pending",
    },
    {
      assignment: assignment2._id,
      student: students[0]._id, // สมชาย: ส่งช้า ตรวจแล้ว (หักคะแนนไปแล้วตาม policy)
      link: "https://example.com/scratch-somchai",
      submittedAt: new Date(past.getTime() + 2 * 24 * 60 * 60 * 1000), // ช้าไป 2 วัน
      isLate: true,
      status: "graded",
      score: 16, // 20 หัก 20% (2 วัน x 10%) จาก 20 เต็ม = หัก 4 ได้ 16
      teacherComment: "งานดีแต่ส่งช้าไปหน่อยนะ",
      gradedAt: now,
    },
  ]);
  console.log("✅ สร้างงานที่ส่งแล้ว 3 รายการ (ตรวจแล้ว 2, รอตรวจ 1, มีเคสส่งช้า 1)");

  // 7) Quiz พร้อมคำถามครบ 4 ชนิด — เผยแพร่แล้วพร้อมให้นักเรียนทำได้ทันที
  const quiz = await Quiz.create({
    title: "แบบทดสอบหน่วยที่ 1",
    unit: unit1._id,
    classroom: classroom._id,
    isPublished: true,
    attemptsAllowed: 2,
    showAnswersAfterSubmit: true,
    questions: [
      {
        type: "multiple_choice",
        questionText: "Flowchart ใช้สัญลักษณ์รูปสี่เหลี่ยมข้าวหลามตัดแทนอะไร?",
        options: ["จุดเริ่มต้น/สิ้นสุด", "การตัดสินใจ", "การประมวลผล", "การรับข้อมูล"],
        correctAnswers: [1],
        points: 2,
      },
      {
        type: "checkbox",
        questionText: "ข้อใดเป็นภาษาโปรแกรมมิ่งบ้าง? (เลือกได้หลายข้อ)",
        options: ["Python", "HTML", "Scratch", "Photoshop"],
        correctAnswers: [0, 2],
        points: 2,
      },
      {
        type: "true_false",
        questionText: "Flowchart ต้องมีจุดเริ่มต้นและจุดสิ้นสุดเสมอ",
        options: ["ถูก", "ผิด"],
        correctAnswers: [0],
        points: 1,
      },
      {
        type: "short_answer",
        questionText: "โปรแกรมบล็อกที่ใช้สอนเขียนโค้ดสำหรับเด็กชื่ออะไร? (ภาษาอังกฤษ)",
        correctAnswers: ["scratch"],
        points: 2,
      },
    ],
  });
  console.log(`✅ สร้าง Quiz: "${quiz.title}" (4 ข้อ เผยแพร่แล้ว)`);

  // 8) จำลองผลการทำ quiz ของนักเรียน 3 คนแรก
  await QuizAttempt.create([
    {
      quiz: quiz._id,
      student: students[0]._id,
      attemptNumber: 1,
      totalScore: 7,
      maxScore: 7,
      submittedAt: now,
      answers: [
        { questionIndex: 0, answer: 1, isCorrect: true, pointsEarned: 2 },
        { questionIndex: 1, answer: [0, 2], isCorrect: true, pointsEarned: 2 },
        { questionIndex: 2, answer: 0, isCorrect: true, pointsEarned: 1 },
        { questionIndex: 3, answer: "scratch", isCorrect: true, pointsEarned: 2 },
      ],
    },
    {
      quiz: quiz._id,
      student: students[1]._id,
      attemptNumber: 1,
      totalScore: 4,
      maxScore: 7,
      submittedAt: now,
      answers: [
        { questionIndex: 0, answer: 1, isCorrect: true, pointsEarned: 2 },
        { questionIndex: 1, answer: [0], isCorrect: false, pointsEarned: 0 },
        { questionIndex: 2, answer: 0, isCorrect: true, pointsEarned: 1 },
        { questionIndex: 3, answer: "scrach", isCorrect: false, pointsEarned: 0 },
      ],
    },
    {
      quiz: quiz._id,
      student: students[2]._id,
      attemptNumber: 1,
      totalScore: 5,
      maxScore: 7,
      submittedAt: now,
      answers: [
        { questionIndex: 0, answer: 2, isCorrect: false, pointsEarned: 0 },
        { questionIndex: 1, answer: [0, 2], isCorrect: true, pointsEarned: 2 },
        { questionIndex: 2, answer: 0, isCorrect: true, pointsEarned: 1 },
        { questionIndex: 3, answer: "Scratch", isCorrect: true, pointsEarned: 2 },
      ],
    },
  ]);
  console.log("✅ สร้างผลการทำ quiz ของนักเรียน 3 คน");

  console.log("\n🎉 สร้าง mock data เสร็จแล้ว! เข้าเทสได้เลย:\n");
  console.log(`   ครู:      ${teacherEmail} / รหัสผ่าน test1234`);
  console.log(`   นักเรียน: รหัสห้อง ${MOCK_JOIN_CODE} + ชื่อ + เลขที่ (เช่น สมชาย ใจดี / 10001)`);
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

seedMockData().catch((err) => {
  console.error("❌ สร้าง mock data ไม่สำเร็จ:", err);
  process.exit(1);
});
