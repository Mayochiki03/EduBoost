import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    mediaUrl: { type: String, default: "" }, // รูป/วิดีโอประกอบงาน (Cloudinary URL)
    mediaType: { type: String, enum: ["image", "video", "none"], default: "none" },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    maxScore: { type: Number, required: true, default: 10 },
    dueDate: { type: Date, required: true },
    rubric: [
      {
        label: String, // เกณฑ์ เช่น "ความถูกต้อง"
        points: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
