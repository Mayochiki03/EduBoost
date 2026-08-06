// รัน: npm run seed
// สร้างบัญชีแอดมินคนแรกจาก ADMIN_EMAIL / ADMIN_PASSWORD ใน .env
// ใช้ครั้งเดียวตอน setup ระบบใหม่ (รันซ้ำได้ ไม่สร้างซ้ำถ้ามีอยู่แล้ว)
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import { hashPassword } from "./authUtils.js";
import mongoose from "mongoose";

dotenv.config();

async function seed() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("กรุณาตั้งค่า ADMIN_EMAIL และ ADMIN_PASSWORD ใน .env ก่อนรัน seed");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`มีบัญชีแอดมิน (${email}) อยู่แล้ว ไม่สร้างซ้ำ`);
  } else {
    await User.create({
      name: "System Admin",
      email,
      password: hashPassword(password),
      role: "admin",
    });
    console.log(`สร้างบัญชีแอดมินเรียบร้อย: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed();
