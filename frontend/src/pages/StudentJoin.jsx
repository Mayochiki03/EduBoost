import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentJoin } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import FieldInput from "../components/FieldInput.jsx";
import GrowthBuddy from "../components/GrowthBuddy.jsx";

export default function StudentJoin() {
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await studentJoin(joinCode.trim(), name.trim(), studentId.trim());
      await login(data.token, "student");
      navigate("/student");
    } catch (err) {
      if (!err.response) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend รันอยู่หรือเน็ตหลุดหรือไม่");
      } else {
        setError(err.response?.data?.message || "เข้าห้องเรียนไม่สำเร็จ ตรวจสอบรหัสห้องอีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-brand-blue font-display font-semibold mb-6 inline-block">
          ← กลับหน้าแรก
        </Link>
        <div className="bg-white rounded-chunky shadow-sticker p-8">
          <div className="flex justify-center mb-2">
            <GrowthBuddy stage={1} size={90} />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink mb-1 text-center">เข้าห้องเรียน</h1>
          <p className="text-ink/60 mb-6 text-center">ไม่ต้องมีรหัสผ่าน แค่รหัสห้องจากครู</p>

          <form onSubmit={handleSubmit}>
            <FieldInput
              label="รหัสห้องเรียน"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="เช่น 123456"
              inputMode="numeric"
              maxLength={6}
              required
            />
            <FieldInput
              label="ชื่อ-นามสกุล"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
              required
            />
            <FieldInput
              label="เลขประจำตัวนักเรียน"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="เช่น 12345"
              required
            />

            {error && (
              <p className="text-brand-coral font-medium mb-4 bg-brand-coral/10 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60"
            >
              {submitting ? "กำลังเข้าห้อง..." : "เข้าร่วมห้องเรียน 🚪"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
