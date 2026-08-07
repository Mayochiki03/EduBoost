// รัน: npm run migrate:username
// ใช้ครั้งเดียวหลังอัปเดตโค้ดที่เพิ่มฟีเจอร์ login ด้วย username (v1.2)
// สร้าง username อัตโนมัติให้บัญชีครู/แอดมินเดิมที่ยังไม่มี username (ตั้งจากส่วนหน้าอีเมล เช่น "aphisorn.s@srinakorn.ac.th" -> "aphisorn.s")
// ถ้าซ้ำกับคนอื่น จะเติมตัวเลขต่อท้ายให้ไม่ชนกัน (เช่น aphisorn.s2, aphisorn.s3)
// รันซ้ำได้ปลอดภัย — ข้ามบัญชีที่มี username อยู่แล้ว ไม่ทับของเดิม
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

async function migrate() {
  await connectDB();

  const usersWithoutUsername = await User.find({
    $or: [{ username: { $exists: false } }, { username: null }],
  });

  if (usersWithoutUsername.length === 0) {
    console.log("✅ ทุกบัญชีมี username แล้ว ไม่ต้องทำอะไรเพิ่ม");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`🔧 พบ ${usersWithoutUsername.length} บัญชีที่ยังไม่มี username กำลังตั้งให้อัตโนมัติ...\n`);

  for (const user of usersWithoutUsername) {
    let base = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
    let candidate = base;
    let suffix = 1;
    // เช็คซ้ำกับ username ที่มีอยู่แล้ว (รวมที่เพิ่งตั้งใน loop นี้ด้วย เพราะ query ใหม่ทุกรอบ)
    while (await User.exists({ username: candidate })) {
      suffix += 1;
      candidate = `${base}${suffix}`;
    }
    user.username = candidate;
    await user.save();
    console.log(`   ${user.email}  →  username: ${candidate}`);
  }

  console.log("\n✅ ตั้ง username ให้ครบทุกบัญชีแล้ว ครูสามารถ login ด้วย username ข้างบนแทนอีเมลได้เลย");
  console.log("   (แจ้งครูแต่ละคนด้วยว่า username ของตัวเองคืออะไร หรือให้แอดมินเปลี่ยนเป็นชื่อที่จำง่ายกว่านี้ทีหลังผ่านหน้า Admin ก็ได้)");

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration ไม่สำเร็จ:", err);
  process.exit(1);
});
