import GrowthAsset from "../models/GrowthAsset.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// ทุกคนที่ login แล้ว (ครู/แอดมิน/นักเรียน) ดูรายการภาพทั้งหมดได้ ใช้แสดงต้นไม้ตาม stage
export async function listGrowthAssets(req, res) {
  try {
    const assets = await GrowthAsset.find().sort({ level: 1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลภาพไม่สำเร็จ", error: err.message });
  }
}

// แอดมินอัปโหลด/แทนที่ภาพของระดับหนึ่ง (รองรับทั้งรูปนิ่งและ GIF — Cloudinary จัดการให้อัตโนมัติ)
export async function upsertGrowthAsset(req, res) {
  try {
    const { level, label } = req.body;
    if (level === undefined || level === null) {
      return res.status(400).json({ message: "กรุณาระบุระดับ (level)" });
    }
    if (!req.files?.image) {
      return res.status(400).json({ message: "กรุณาแนบไฟล์ภาพหรือ GIF" });
    }

    const uploaded = await uploadToCloudinary(req.files.image.tempFilePath, "growth-assets");

    const existing = await GrowthAsset.findOne({ level: Number(level) });
    if (existing) {
      // ลบไฟล์เก่าออกจาก Cloudinary ก่อน กันขยะสะสมเวลาอัปโหลดทับ
      if (existing.publicId) await deleteFromCloudinary(existing.publicId, "image").catch(() => {});
      existing.imageUrl = uploaded.url;
      existing.publicId = uploaded.publicId;
      if (label !== undefined) existing.label = label;
      await existing.save();
      return res.json(existing);
    }

    const asset = await GrowthAsset.create({
      level: Number(level),
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      label: label || "",
    });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดภาพไม่สำเร็จ", error: err.message });
  }
}

export async function deleteGrowthAsset(req, res) {
  try {
    const asset = await GrowthAsset.findOne({ level: Number(req.params.level) });
    if (!asset) return res.status(404).json({ message: "ไม่พบภาพระดับนี้" });
    if (asset.publicId) await deleteFromCloudinary(asset.publicId, "image").catch(() => {});
    await asset.deleteOne();
    res.json({ message: "ลบภาพเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ message: "ลบภาพไม่สำเร็จ", error: err.message });
  }
}
