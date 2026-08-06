import express from "express";
import { listGrowthAssets, upsertGrowthAsset, deleteGrowthAsset } from "../controllers/growthAssetController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ทุก role ที่ login แล้วดูได้ (ต้องใช้แสดงต้นไม้ทั้งฝั่งครูและนักเรียน)
router.get("/", requireAuth, listGrowthAssets);

// เฉพาะแอดมินอัปโหลด/ลบภาพได้
router.post("/", requireAuth, requireRole("admin"), upsertGrowthAsset);
router.delete("/:level", requireAuth, requireRole("admin"), deleteGrowthAsset);

export default router;
