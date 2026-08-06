import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple_choice", "checkbox", "true_false", "short_answer"],
    required: true,
  },
  questionText: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  options: [String], // สำหรับ multiple_choice / checkbox / true_false — เก็บเป็น string ตรงๆ (ไม่ใช่ subdocument) ให้ตรงกับที่ controller/frontend ใช้จริง
  correctAnswers: [{ type: mongoose.Schema.Types.Mixed }], // index ของ option ที่ถูก หรือ ข้อความ (short_answer)
  points: { type: Number, default: 1 },
  timeLimitSeconds: { type: Number, default: 30 },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    questions: [questionSchema],
    dueDate: { type: Date, default: null },
    attemptsAllowed: { type: Number, default: 1 },
    showAnswersAfterSubmit: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
