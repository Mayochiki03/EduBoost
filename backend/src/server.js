// ต้อง import "dotenv/config" เป็นบรรทัดแรกสุดเสมอ เพราะ ES Module จะรัน import ทั้งหมดก่อนโค้ดอื่นในไฟล์
// ถ้าเรียก dotenv.config() หลัง import routes/config อื่นๆ ตัวแปร .env จะยังไม่ถูกโหลดตอนไฟล์เหล่านั้นทำงาน (เช่น cloudinary.config() จะได้ api_key เป็น undefined)
import "dotenv/config";

import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import growthAssetRoutes from "./routes/growthAssetRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB ต่อไฟล์ (ปรับได้)
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/growth-assets", growthAssetRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "ไม่พบเส้นทางนี้" }));

// error handler กลาง (กันเซิร์ฟเวอร์ล่มจาก error ที่ไม่ได้ catch)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์", error: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] running on port ${PORT}`));
});
