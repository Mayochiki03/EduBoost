import mongoose from "mongoose";

// หน่วยการเรียน เช่น "หน่วยที่ 1: พื้นฐานการเขียนโปรแกรม"
const unitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    order: { type: Number, default: 0 }, // ลำดับการแสดงผล
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    rewardTiers: [
      {
        rank: Number, // อันดับ 1-5
        rewardLabel: String, // ชื่อรางวัล เช่น "สติกเกอร์ทอง"
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Unit", unitSchema);
