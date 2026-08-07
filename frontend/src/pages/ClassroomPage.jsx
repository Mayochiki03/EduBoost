import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getClassroom, listStudents, updateClassroom, removeStudent } from "../api/classrooms.js";
import { listUnits, createUnit, deleteUnit } from "../api/units.js";
import { listAssignmentsByUnit, createAssignment, updateAssignment, deleteAssignment } from "../api/assignments.js";
import Modal from "../components/Modal.jsx";
import FieldInput from "../components/FieldInput.jsx";
import QuizzesInUnit from "../components/QuizzesInUnit.jsx";
import LeaderboardSection from "../components/LeaderboardSection.jsx";
import { Trash2, Pencil, Plus } from "lucide-react";

const TABS = [
  { key: "units", label: "หน่วย/งาน" },
  { key: "students", label: "รายชื่อนักเรียน" },
  { key: "settings", label: "ตั้งค่า" },
];

export default function ClassroomPage() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [tab, setTab] = useState("units");

  useEffect(() => {
    getClassroom(id).then(setClassroom);
  }, [id]);

  if (!classroom) return <div className="min-h-screen flex items-center justify-center text-ink/50">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <Link to="/teacher" className="text-brand-blue font-display font-semibold mb-4 inline-block">
          ← ห้องเรียนทั้งหมด
        </Link>

        <div className="rounded-chunky p-6 text-white mb-6" style={{ backgroundColor: classroom.coverColor }}>
          <h1 className="font-display text-3xl font-bold">{classroom.subjectName}</h1>
          <p className="opacity-90">{classroom.gradeLevel} • นักเรียน {classroom.studentCount} คน</p>
          <p className="text-sm bg-white/20 inline-block rounded-full px-3 py-1 mt-2">
            รหัสห้อง: {classroom.joinCode}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-display font-semibold px-4 py-2 rounded-full transition-colors ${
                tab === t.key ? "bg-ink text-white" : "bg-white text-ink/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "units" && <UnitsTab classroomId={id} />}
        {tab === "students" && <StudentsTab classroomId={id} />}
        {tab === "settings" && <SettingsTab classroom={classroom} onUpdated={setClassroom} />}
      </div>
    </div>
  );
}

function UnitsTab({ classroomId }) {
  const [units, setUnits] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [unitTitle, setUnitTitle] = useState("");
  const [expandedUnit, setExpandedUnit] = useState(null);

  useEffect(() => {
    loadUnits();
  }, [classroomId]);

  async function loadUnits() {
    const data = await listUnits(classroomId);
    setUnits(data);
  }

  async function handleCreateUnit(e) {
    e.preventDefault();
    await createUnit({ classroomId, title: unitTitle, order: units.length });
    setUnitTitle("");
    setModalOpen(false);
    loadUnits();
  }

  async function handleDeleteUnit(unitId) {
    if (!confirm("ลบหน่วยนี้? (ลบไม่ได้ถ้ายังมีงาน/quiz อยู่ข้างใน)")) return;
    try {
      await deleteUnit(unitId);
      loadUnits();
    } catch (err) {
      alert(err.response?.data?.message || "ลบไม่สำเร็จ");
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalOpen(true)} className="btn-sticker bg-brand-mint shadow-[0_6px_0_0_#0e9270]">
          <Plus size={18} /> สร้างหน่วยการเรียน
        </button>
      </div>

      {units.length === 0 && (
        <div className="bg-white rounded-chunky p-8 text-center text-ink/50">ยังไม่มีหน่วยการเรียน</div>
      )}

      <div className="space-y-4">
        {units.map((u) => (
          <div key={u._id} className="bg-white rounded-chunky shadow-sticker p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                className="font-display text-lg font-bold text-left flex-1"
                onClick={() => setExpandedUnit(expandedUnit === u._id ? null : u._id)}
              >
                {u.title} {expandedUnit === u._id ? "▲" : "▼"}
              </button>
              <LeaderboardSection unitId={u._id} />
              <button onClick={() => handleDeleteUnit(u._id)} className="text-brand-coral text-sm font-semibold ml-3 inline-flex items-center gap-1">
                <Trash2 size={14} /> ลบ
              </button>
            </div>
            {expandedUnit === u._id && (
              <>
                <AssignmentsInUnit unitId={u._id} />
                <QuizzesInUnit unitId={u._id} />
              </>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="สร้างหน่วยการเรียน">
        <form onSubmit={handleCreateUnit}>
          <FieldInput
            label="ชื่อหน่วย"
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            placeholder="เช่น หน่วยที่ 1 พื้นฐานการเขียนโปรแกรม"
            required
          />
          <button type="submit" className="btn-sticker w-full bg-brand-mint shadow-[0_6px_0_0_#0e9270]">
            สร้างหน่วย
          </button>
        </form>
      </Modal>
    </div>
  );
}

function AssignmentsInUnit({ unitId }) {
  const [assignments, setAssignments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", maxScore: 10, dueDate: "" });
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [unitId]);

  async function loadAssignments() {
    const data = await listAssignmentsByUnit(unitId);
    setAssignments(data);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ title: "", description: "", maxScore: 10, dueDate: "" });
    setMediaFile(null);
    setModalOpen(true);
  }

  function openEditModal(a) {
    setEditingId(a._id);
    setForm({
      title: a.title,
      description: a.description || "",
      maxScore: a.maxScore,
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "",
    });
    setMediaFile(null);
    setModalOpen(true);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAssignment(editingId, { ...form, media: mediaFile || undefined });
      } else {
        await createAssignment({ unitId, ...form, media: mediaFile || undefined });
      }
      setModalOpen(false);
      loadAssignments();
    } catch (err) {
      alert(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(assignmentId) {
    if (!confirm("ลบงานนี้? งานที่นักเรียนส่งไว้จะถูกลบด้วย")) return;
    await deleteAssignment(assignmentId);
    loadAssignments();
  }

  return (
    <div className="mt-4 pl-2 border-l-4 border-paper">
      <div className="flex justify-end mb-3">
        <button onClick={openCreateModal} className="text-brand-blue font-display font-semibold text-sm inline-flex items-center gap-1">
          <Plus size={14} /> เพิ่มงานในหน่วยนี้
        </button>
      </div>
      {assignments.length === 0 && <p className="text-ink/40 text-sm mb-2">ยังไม่มีงานในหน่วยนี้</p>}
      <ul className="space-y-2">
        {assignments.map((a) => (
          <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 bg-paper rounded-xl px-4 py-2">
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-ink/50">
                กำหนดส่ง {new Date(a.dueDate).toLocaleDateString("th-TH")} • ส่งแล้ว {a.submittedCount} คน • เต็ม {a.maxScore} คะแนน
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to={`/teacher/assignments/${a._id}`} className="text-brand-blue text-sm font-semibold">
                ตรวจงาน
              </Link>
              <button onClick={() => openEditModal(a)} className="text-brand-violet text-sm font-semibold inline-flex items-center gap-1">
                <Pencil size={14} /> แก้ไข
              </button>
              <button onClick={() => handleDelete(a._id)} className="text-brand-coral text-sm font-semibold inline-flex items-center gap-1">
                <Trash2 size={14} /> ลบ
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "แก้ไขงาน" : "สร้างงานใหม่"}>
        <form onSubmit={handleSubmitForm}>
          <FieldInput
            label="ชื่องาน"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <label className="block text-left mb-4">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">รายละเอียด</span>
            <textarea
              className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-ink"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <FieldInput
            label="คะแนนเต็ม"
            type="number"
            min={1}
            value={form.maxScore}
            onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
            required
          />
          <FieldInput
            label="กำหนดส่ง"
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
          />
          <label className="block text-left mb-5">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">
              {editingId ? "แนบไฟล์ใหม่ (รูป/PDF/วิดีโอ, ไม่บังคับ ถ้าไม่แนบจะใช้ของเดิม)" : "แนบไฟล์ประกอบ (รูป/PDF/วิดีโอ, ไม่บังคับ)"}
            </span>
            <input type="file" accept="image/*,video/*,application/pdf" onChange={(e) => setMediaFile(e.target.files[0])} />
          </label>
          <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
            {submitting ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "สร้างงาน"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function StudentsTab({ classroomId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    load();
  }, [classroomId]);

  async function load() {
    const data = await listStudents(classroomId);
    setStudents(data);
  }

  async function handleRemove(student) {
    if (!confirm(`ลบ "${student.name}" (เลขที่ ${student.studentId}) ออกจากห้อง? งาน/คะแนน quiz ของคนนี้จะถูกลบไปด้วย`)) return;
    try {
      await removeStudent(classroomId, student._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="bg-white rounded-chunky shadow-sticker p-5">
      <p className="text-ink/40 text-xs mb-2">
        ถ้าเห็นชื่อซ้ำ/พิมพ์ผิด (เช่นเลขที่พิมพ์ผิด 1 ตัว) ลบรายการที่ผิดออกได้เลย นักเรียนคนนั้นเข้าห้องใหม่แล้วเลือกชื่อที่ถูกได้ทันที
      </p>
      {students.length === 0 && <p className="text-ink/50 text-center py-6">ยังไม่มีนักเรียนเข้าห้องนี้</p>}
      <ul className="divide-y divide-paper">
        {students.map((s) => (
          <li key={s._id} className="flex items-center justify-between py-3 gap-3">
            <div>
              <span className="font-medium">{s.name}</span>
              <span className="text-ink/50 ml-2">เลขที่ {s.studentId}</span>
            </div>
            <button
              onClick={() => handleRemove(s)}
              className="text-brand-coral text-sm font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <Trash2 size={14} /> ลบ
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingsTab({ classroom, onUpdated }) {
  const [policyType, setPolicyType] = useState(classroom.lateSubmissionPolicy?.type || "none");
  const [policyValue, setPolicyValue] = useState(classroom.lateSubmissionPolicy?.value || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const updated = await updateClassroom(classroom._id, {
      lateSubmissionPolicy: { type: policyType, value: Number(policyValue) },
    });
    onUpdated({ ...classroom, ...updated });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="bg-white rounded-chunky shadow-sticker p-6">
      <h3 className="font-display text-lg font-bold mb-3">นโยบายหักคะแนนส่งงานช้า</h3>
      <div className="space-y-2 mb-4">
        {[
          { value: "none", label: "ไม่หักคะแนน แม้จะส่งช้า" },
          { value: "fixedDeduction", label: "หักคะแนนคงที่ทุกครั้งที่ส่งช้า" },
          { value: "percentPerDay", label: "หักเป็น % ต่อวันที่ส่งช้า" },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="policy"
              checked={policyType === opt.value}
              onChange={() => setPolicyType(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {policyType !== "none" && (
        <FieldInput
          label={policyType === "fixedDeduction" ? "หักกี่คะแนน" : "หักกี่ % ต่อวัน"}
          type="number"
          min={0}
          value={policyValue}
          onChange={(e) => setPolicyValue(e.target.value)}
        />
      )}
      <button onClick={handleSave} disabled={saving} className="btn-sticker bg-brand-violet shadow-[0_6px_0_0_#6d28d9] disabled:opacity-60">
        {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
      {saved && <p className="text-brand-mint font-semibold mt-2">บันทึกแล้ว ✓</p>}
    </div>
  );
}
