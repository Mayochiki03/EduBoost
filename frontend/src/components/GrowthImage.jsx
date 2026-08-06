import { useEffect, useState } from "react";
import { listGrowthAssets } from "../api/growthAssets.js";
import GrowthBuddy from "./GrowthBuddy.jsx";

// cache ระดับโมดูล กันเรียก API ซ้ำทุกครั้งที่ component นี้ถูกใช้หลายจุดในหน้าเดียว (รายการภาพมีไม่กี่รายการ ไม่ค่อยเปลี่ยนบ่อย)
let assetsCache = null;
let assetsPromise = null;

function loadAssets() {
  if (assetsCache) return Promise.resolve(assetsCache);
  if (!assetsPromise) {
    assetsPromise = listGrowthAssets()
      .then((data) => {
        assetsCache = data;
        return data;
      })
      .catch(() => {
        assetsPromise = null; // ให้ลองใหม่ได้ถ้าเรียกครั้งแรกพลาด (เช่นยัง login ไม่เสร็จ)
        return [];
      });
  }
  return assetsPromise;
}

// เรียกจากหน้า Admin หลังอัปโหลด/ลบภาพ เพื่อล้าง cache ให้ทุกจุดที่ใช้ GrowthImage ดึงข้อมูลใหม่
export function invalidateGrowthAssetsCache() {
  assetsCache = null;
  assetsPromise = null;
}

export default function GrowthImage({ stage = 0, size = 140 }) {
  const [assets, setAssets] = useState(assetsCache || []);

  useEffect(() => {
    let active = true;
    loadAssets().then((data) => {
      if (active) setAssets(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const match = assets.find((a) => a.level === stage);

  if (match) {
    return (
      <img
        src={match.imageUrl}
        alt={match.label || `ต้นไม้ระดับ ${stage}`}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  // ยังไม่มีภาพที่แอดมินอัปโหลดสำหรับ level นี้ — ใช้ตัวการ์ตูน SVG เริ่มต้นแทน ไม่ให้หน้าจอว่างเปล่า
  return <GrowthBuddy stage={Math.min(5, Math.round((stage / 10) * 5))} size={size} />;
}
