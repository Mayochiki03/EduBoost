import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["admin", "teacher"], default: "teacher" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
