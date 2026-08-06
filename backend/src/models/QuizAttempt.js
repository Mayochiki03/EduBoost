import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    answers: [
      {
        questionIndex: Number,
        answer: mongoose.Schema.Types.Mixed, // index(es) หรือ ข้อความ
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
