import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    // เนื้อหาที่ส่ง: ไฟล์ (Cloudinary) หรือ ลิงก์
    files: [
      {
        url: String,
        publicId: String,
        resourceType: String, // image | video | raw(pdf)
        originalName: String,
      },
    ],
    link: { type: String, default: "" }, // ลิงก์ที่นักเรียนแนบ (เช่น Google Doc)
    note: { type: String, default: "" }, // ข้อความเพิ่มเติมจากนักเรียน

    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },

    // การให้คะแนน
    status: { type: String, enum: ["pending", "graded"], default: "pending" },
    score: { type: Number, default: null },
    rubricScores: [{ label: String, points: Number }],
    teacherComment: { type: String, default: "" },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// นักเรียนหนึ่งคนส่งได้หลายครั้งต่อธานงานเดียว (resubmit) แต่ query ง่ายๆ ด้วย index นี้
submissionSchema.index({ assignment: 1, student: 1 });

export default mongoose.model("Submission", submissionSchema);
