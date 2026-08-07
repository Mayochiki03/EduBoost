import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // username สำหรับ login แทนอีเมล (สั้นกว่า พิมพ์เร็วกว่า) — ไม่บังคับตอนสมัคร แต่ถ้าจะ login ด้วย username ต้องตั้งไว้ก่อน
    // sparse: true ทำให้หลายคนไม่มี username พร้อมกันได้โดยไม่ชนกับ unique index (ค่า null ไม่นับซ้ำ)
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["admin", "teacher"], default: "teacher" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
