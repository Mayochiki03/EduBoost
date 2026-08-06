import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listClassrooms, createClassroom } from "../api/classrooms.js";
import Modal from "../components/Modal.jsx";
import FieldInput from "../components/FieldInput.jsx";
import Navbar from "../components/Navbar.jsx";

const COVER_COLORS = ["#3B6EF6", "#FF6B5B", "#FFC145", "#2FBF8F", "#8B5CF6"];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subjectName: "", gradeLevel: "", coverColor: COVER_COLORS[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  async function loadClassrooms() {
    setLoading(true);
    try {
      const data = await listClassrooms();
      setClassrooms(data);
    } catch {
      setError("โหลดข้อมูลห้องเรียนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createClassroom(form);
      setModalOpen(false);
      setForm({ subjectName: "", gradeLevel: "", coverColor: COVER_COLORS[0] });
      loadClassrooms();
    } catch (err) {
      setError(err.response?.data?.message || "สร้างห้องเรียนไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar
        homeLink="/teacher"
        name={user?.user?.name}
        role={user?.role}
        onLogout={logout}
        rightExtra={
          user?.role === "admin" && (
            <Link to="/admin" className="text-brand-violet font-display font-semibold text-sm whitespace-nowrap">
              แผงควบคุมแอดมิน
            </Link>
          )
        }
      />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">ห้องเรียนของฉัน</h2>
          <button onClick={() => setModalOpen(true)} className="btn-sticker bg-brand-blue shadow-[0_6px_0_0_#1d4ed8]">
            + สร้างห้องเรียน
          </button>
        </div>

        {loading && <p className="text-ink/50">กำลังโหลด...</p>}
        {!loading && classrooms.length === 0 && (
          <div className="bg-white rounded-chunky p-10 text-center text-ink/50">
            ยังไม่มีห้องเรียน กดปุ่ม "สร้างห้องเรียน" เพื่อเริ่มต้นได้เลย
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c) => (
            <Link
              key={c._id}
              to={`/teacher/classrooms/${c._id}`}
              className="rounded-chunky p-5 text-white shadow-sticker hover:-translate-y-1 transition-transform"
              style={{ backgroundColor: c.coverColor }}
            >
              <p className="font-display text-xl font-bold mb-1">{c.subjectName}</p>
              <p className="opacity-90 mb-4">{c.gradeLevel}</p>
              <p className="text-sm bg-white/20 inline-block rounded-full px-3 py-1">
                รหัสห้อง: {c.joinCode}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="สร้างห้องเรียนใหม่">
        <form onSubmit={handleCreate}>
          <FieldInput
            label="ชื่อวิชา"
            value={form.subjectName}
            onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
            placeholder="เช่น วิทยาการคำนวณ"
            required
          />
          <FieldInput
            label="ระดับชั้น"
            value={form.gradeLevel}
            onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
            placeholder="เช่น ม.1/1"
            required
          />
          <p className="font-display font-semibold text-ink/80 mb-2">สีประจำห้อง</p>
          <div className="flex gap-3 mb-5">
            {COVER_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setForm({ ...form, coverColor: color })}
                className="w-9 h-9 rounded-full border-4"
                style={{ backgroundColor: color, borderColor: form.coverColor === color ? "#2B2438" : "transparent" }}
                aria-label={`เลือกสี ${color}`}
              />
            ))}
          </div>
          {error && <p className="text-brand-coral font-medium mb-4">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
            {submitting ? "กำลังสร้าง..." : "สร้างห้องเรียน"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
