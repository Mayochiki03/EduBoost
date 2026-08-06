import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true }, // ชื่อวิชา
    gradeLevel: { type: String, required: true }, // ระดับชั้น เช่น ม.1/1
    joinCode: { type: String, required: true, unique: true }, // รหัสห้องเรียน 6 หลัก
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverColor: { type: String, default: "#3B82F6" }, // สีธีมของห้อง (สุ่ม/เลือกได้)
    lateSubmissionPolicy: {
      type: { type: String, enum: ["none", "fixedDeduction", "percentPerDay"], default: "none" },
      value: { type: Number, default: 0 }, // fixed points OR % per day
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Classroom", classroomSchema);
