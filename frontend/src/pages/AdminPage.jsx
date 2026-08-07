import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTeachers, createTeacher } from "../api/admin.js";
import { listClassrooms } from "../api/classrooms.js";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import FieldInput from "../components/FieldInput.jsx";
import GrowthAssetManager from "../components/GrowthAssetManager.jsx";
import Navbar from "../components/Navbar.jsx";

export default function AdminPage() {
  const { logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", role: "teacher" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [t, c] = await Promise.all([listTeachers(), listClassrooms()]);
    setTeachers(t);
    setClassrooms(c);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createTeacher(form);
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "teacher" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "สร้างบัญชีไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar
        homeLink="/admin"
        name="แผงควบคุมแอดมิน"
        onLogout={logout}
        rightExtra={
          <Link to="/teacher" className="text-brand-blue font-display font-semibold text-sm whitespace-nowrap">
            ห้องเรียนของฉัน
          </Link>
        }
      />
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <h1 className="font-display text-2xl font-bold mb-6">ภาพรวมทั้งระบบ</h1>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">บัญชีครู/แอดมิน ({teachers.length})</h2>
            <button onClick={() => setModalOpen(true)} className="btn-sticker bg-brand-violet shadow-[0_6px_0_0_#6d28d9]">
              + สร้างบัญชีครู
            </button>
          </div>
          <div className="bg-white rounded-chunky shadow-sticker divide-y divide-paper">
            {teachers.map((t) => (
              <div key={t._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-ink/50">
                    {t.email}
                    {t.username && <span className="ml-2 text-brand-blue">@{t.username}</span>}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.role === "admin" ? "bg-brand-violet/20 text-brand-violet" : "bg-brand-blue/20 text-brand-blue"}`}>
                  {t.role === "admin" ? "แอดมิน" : "ครู"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <GrowthAssetManager />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-4">ห้องเรียนทั้งหมดในระบบ ({classrooms.length})</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {classrooms.map((c) => (
              <div key={c._id} className="rounded-chunky p-4 text-white" style={{ backgroundColor: c.coverColor }}>
                <p className="font-display font-bold">{c.subjectName}</p>
                <p className="text-sm opacity-90">
                  {c.gradeLevel} • ครู {c.teacher?.name}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="สร้างบัญชีครูใหม่">
        <form onSubmit={handleCreate}>
          <FieldInput label="ชื่อ-นามสกุล" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FieldInput
            label="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <FieldInput
            label="Username (ไม่บังคับ ใช้ login แทนอีเมลได้)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="เช่น aphisorn"
          />
          <FieldInput
            label="รหัสผ่าน"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label className="block text-left mb-4">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">บทบาท</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3"
            >
              <option value="teacher">ครู</option>
              <option value="admin">แอดมิน</option>
            </select>
          </label>
          {error && <p className="text-brand-coral font-medium mb-4">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-violet shadow-[0_6px_0_0_#6d28d9] disabled:opacity-60">
            {submitting ? "กำลังสร้าง..." : "สร้างบัญชี"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
