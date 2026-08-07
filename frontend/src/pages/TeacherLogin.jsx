import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginTeacher } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import FieldInput from "../components/FieldInput.jsx";

export default function TeacherLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginTeacher(identifier.trim(), password);
      await login(data.token, data.user.role);
      navigate("/teacher");
    } catch (err) {
      if (!err.response) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend รันอยู่หรือเน็ตหลุดหรือไม่");
      } else {
        setError(err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-brand-violet font-display font-semibold mb-6 inline-block">
          ← กลับหน้าแรก
        </Link>
        <div className="bg-white rounded-chunky shadow-sticker p-8">
          <h1 className="font-display text-3xl font-bold text-ink mb-1">เข้าสู่ระบบครู</h1>
          <p className="text-ink/60 mb-6">สำหรับครูและแอดมิน</p>

          <form onSubmit={handleSubmit}>
            <FieldInput
              label="อีเมล หรือ Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="เช่น aphisorn หรือ teacher@school.ac.th"
              required
            />
            <FieldInput
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              className="btn-sticker w-full bg-brand-violet shadow-[0_6px_0_0_#6d28d9] disabled:opacity-60"
            >
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
