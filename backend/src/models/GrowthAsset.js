import mongoose from "mongoose";

// ภาพ/GIF ต้นไม้แต่ละระดับ ที่แอดมินอัปโหลดเอง แทนที่ตัวการ์ตูน SVG เริ่มต้น
// level 0 = ยังไม่ส่งงานเลย, level สูงสุด (ปรับได้ ปกติ 10) = โตเต็มที่
const growthAssetSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, unique: true, min: 0 },
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: "" }, // ใช้ตอนลบไฟล์เก่าออกจาก Cloudinary เวลาอัปโหลดทับ
    label: { type: String, default: "" }, // ชื่อเรียกระดับ เช่น "ต้นกล้า", "ออกดอก" (ไม่บังคับ)
  },
  { timestamps: true }
);

export default mongoose.model("GrowthAsset", growthAssetSchema);
