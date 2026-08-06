import { useEffect, useState } from "react";
import { listGrowthAssets, uploadGrowthAsset, deleteGrowthAsset } from "../api/growthAssets.js";
import { invalidateGrowthAssetsCache } from "./GrowthImage.jsx";

const LEVELS = Array.from({ length: 11 }, (_, i) => i); // 0-10

export default function GrowthAssetManager() {
  const [assets, setAssets] = useState([]);
  const [uploadingLevel, setUploadingLevel] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await listGrowthAssets();
    setAssets(data);
  }

  async function handleUpload(level, file) {
    if (!file) return;
    setUploadingLevel(level);
    try {
      await uploadGrowthAsset(level, file);
      invalidateGrowthAssetsCache(); // ล้าง cache กลาง ให้หน้านักเรียน/ครูดึงภาพใหม่ทันทีโดยไม่ต้องรีเฟรชแอปทั้งหมด
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadingLevel(null);
    }
  }

  async function handleDelete(level) {
    if (!confirm(`ลบภาพระดับ ${level}? จะกลับไปใช้ตัวการ์ตูนเริ่มต้นแทน`)) return;
    await deleteGrowthAsset(level);
    invalidateGrowthAssetsCache();
    load();
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold mb-1">🌳 ภาพต้นไม้แต่ละระดับการเติบโต</h2>
      <p className="text-ink/50 text-sm mb-4">
        อัปโหลดภาพหรือ GIF สำหรับแต่ละระดับ (0 = ยังไม่ส่งงาน, 10 = โตเต็มที่) ถ้าระดับไหนยังไม่อัปโหลด ระบบจะใช้ตัวการ์ตูนเริ่มต้นแทนไปก่อน รองรับไฟล์ .gif ให้ต้นไม้ขยับได้
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {LEVELS.map((level) => {
          const asset = assets.find((a) => a.level === level);
          return (
            <div key={level} className="bg-white rounded-2xl shadow-sticker p-3 text-center">
              <p className="font-display font-bold text-sm mb-2">ระดับ {level}</p>
              <div className="w-full aspect-square bg-paper rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                {asset ? (
                  <img src={asset.imageUrl} alt={`ระดับ ${level}`} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-ink/30 text-xs">ยังไม่มีภาพ</span>
                )}
              </div>
              <label className="block">
                <span className="sr-only">อัปโหลดภาพระดับ {level}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs w-full"
                  disabled={uploadingLevel === level}
                  onChange={(e) => handleUpload(level, e.target.files[0])}
                />
              </label>
              {uploadingLevel === level && <p className="text-xs text-brand-blue mt-1">กำลังอัปโหลด...</p>}
              {asset && (
                <button onClick={() => handleDelete(level)} className="text-brand-coral text-xs font-semibold mt-1">
                  ลบภาพนี้
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
