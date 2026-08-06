import mongoose from "mongoose";

// นักเรียนไม่มีรหัสผ่าน เข้าห้องด้วย joinCode + ชื่อ + รหัสนักเรียน
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    studentId: { type: String, required: true }, // เลขประจำตัวนักเรียน
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    avatarSeed: { type: String, default: "" }, // ใช้ generate avatar การ์ตูนแบบ deterministic
  },
  { timestamps: true }
);

// นักเรียนคนหนึ่งมีได้ 1 รายชื่อต่อห้อง (กันสมัครซ้ำ)
studentSchema.index({ studentId: 1, classroom: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);
