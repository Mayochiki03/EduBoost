import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listClassrooms, createClassroom, reorderClassrooms } from "../api/classrooms.js";
import Modal from "../components/Modal.jsx";
import FieldInput from "../components/FieldInput.jsx";
import Navbar from "../components/Navbar.jsx";
import { Plus, GripVertical } from "lucide-react";

// ขยายเป็น 12 สีให้เลือกหลากหลายขึ้นตามที่ขอ (เดิมมีแค่ 5 สี)
const COVER_COLORS = [
  "#3B6EF6", "#FF6B5B", "#FFC145", "#2FBF8F", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#EF4444",
  "#0EA5E9", "#84CC16",
];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subjectName: "", gradeLevel: "", coverColor: COVER_COLORS[0] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dragIndex = useRef(null);

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

  // ลาก-วางจัดลำดับห้องเรียนใหม่ ใช้ HTML5 drag API ธรรมดา ไม่ต้องพึ่ง library เพิ่ม
  function handleDragStart(index) {
    dragIndex.current = index;
  }

  function handleDragOver(e, overIndex) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === overIndex) return;
    const next = [...classrooms];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(overIndex, 0, moved);
    dragIndex.current = overIndex;
    setClassrooms(next);
  }

  async function handleDragEnd() {
    dragIndex.current = null;
    // บันทึกลำดับใหม่ลง backend ทันทีที่ปล่อยเมาส์ ให้ลำดับติดไว้ถาวร ไม่ใช่แค่บนหน้าจอ
    await reorderClassrooms(classrooms.map((c, i) => ({ id: c._id, order: i })));
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
            <Plus size={18} /> สร้างห้องเรียน
          </button>
        </div>

        {loading && <p className="text-ink/50">กำลังโหลด...</p>}
        {!loading && classrooms.length === 0 && (
          <div className="bg-white rounded-chunky p-10 text-center text-ink/50">
            ยังไม่มีห้องเรียน กดปุ่ม "สร้างห้องเรียน" เพื่อเริ่มต้นได้เลย
          </div>
        )}
        {classrooms.length > 1 && (
          <p className="text-ink/40 text-xs mb-3">ลากมุมซ้ายบนของการ์ดเพื่อจัดลำดับห้องเรียนใหม่ได้</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map((c, index) => (
            <div
              key={c._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="relative rounded-chunky text-white shadow-sticker hover:-translate-y-1 transition-transform"
              style={{ backgroundColor: c.coverColor }}
            >
              <div className="absolute top-3 left-3 cursor-grab active:cursor-grabbing text-white/60 hover:text-white/90">
                <GripVertical size={18} />
              </div>
              <Link to={`/teacher/classrooms/${c._id}`} className="block p-5 pt-9">
                <p className="font-display text-xl font-bold mb-1">{c.subjectName}</p>
                <p className="opacity-90 mb-4">{c.gradeLevel}</p>
                <p className="text-sm bg-white/20 inline-block rounded-full px-3 py-1">
                  รหัสห้อง: {c.joinCode}
                </p>
              </Link>
            </div>
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
          <div className="flex flex-wrap gap-3 mb-5">
            {COVER_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setForm({ ...form, coverColor: color })}
                className="w-9 h-9 rounded-full border-4 transition-transform hover:scale-110"
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
