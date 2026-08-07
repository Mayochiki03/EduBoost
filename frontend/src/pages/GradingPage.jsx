import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAssignment } from "../api/assignments.js";
import { listSubmissionsForAssignment, gradeSubmission } from "../api/submissions.js";
import FileAttachment from "../components/FileAttachment.jsx";

export default function GradingPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingId, setGradingId] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const [a, subs] = await Promise.all([getAssignment(id), listSubmissionsForAssignment(id)]);
    setAssignment(a);
    setSubmissions(subs);
  }

  if (!assignment) return <div className="min-h-screen flex items-center justify-center text-ink/50">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to={`/teacher/classrooms/${assignment.classroom}`} className="text-brand-blue font-display font-semibold mb-4 inline-block">
          ← กลับห้องเรียน
        </Link>

        <div className="bg-white rounded-chunky shadow-sticker p-6 mb-6">
          <h1 className="font-display text-2xl font-bold">{assignment.title}</h1>
          <p className="text-ink/60">
            กำหนดส่ง {new Date(assignment.dueDate).toLocaleString("th-TH")} • เต็ม {assignment.maxScore} คะแนน
          </p>
        </div>

        <h2 className="font-display text-lg font-bold mb-3">งานที่ส่งแล้ว ({submissions.length})</h2>

        {submissions.length === 0 && (
          <div className="bg-white rounded-chunky p-8 text-center text-ink/50">ยังไม่มีใครส่งงานนี้</div>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub._id}
              submission={sub}
              maxScore={assignment.maxScore}
              editing={gradingId === sub._id}
              onEdit={() => setGradingId(sub._id)}
              onCancel={() => setGradingId(null)}
              onGraded={(updated) => {
                setSubmissions(submissions.map((s) => (s._id === updated._id ? updated : s)));
                setGradingId(null);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ submission, maxScore, editing, onEdit, onCancel, onGraded }) {
  const [rawScore, setRawScore] = useState(submission.score ?? "");
  const [comment, setComment] = useState(submission.teacherComment || "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await gradeSubmission(submission._id, { rawScore: Number(rawScore), teacherComment: comment });
      onGraded(updated);
    } catch (err) {
      alert(err.response?.data?.message || "ให้คะแนนไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-chunky shadow-sticker p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-display font-bold">{submission.student?.name}</p>
          <p className="text-sm text-ink/50">
            เลขที่ {submission.student?.studentId} • ส่งเมื่อ {new Date(submission.submittedAt).toLocaleString("th-TH")}
            {submission.isLate && <span className="text-brand-coral font-semibold"> • ส่งช้า</span>}
          </p>
        </div>
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            submission.status === "graded" ? "bg-brand-mint/20 text-brand-mint" : "bg-brand-sun/20 text-amber-700"
          }`}
        >
          {submission.status === "graded" ? `ตรวจแล้ว ${submission.score}/${maxScore}` : "รอตรวจ"}
        </span>
      </div>

      {submission.files?.length > 0 && (
        <div className="space-y-2 mb-2">
          {submission.files.map((f, i) => (
            <FileAttachment key={i} url={f.url} name={f.originalName} kind={f.resourceType} compact />
          ))}
        </div>
      )}
      {submission.link && (
        <p className="text-sm mb-2">
          🔗{" "}
          <a href={submission.link} target="_blank" rel="noreferrer" className="text-brand-blue underline">
            {submission.link}
          </a>
        </p>
      )}
      {submission.note && <p className="text-sm text-ink/70 mb-2">หมายเหตุ: {submission.note}</p>}

      {!editing && (
        <button onClick={onEdit} className="text-brand-violet font-semibold text-sm">
          {submission.status === "graded" ? "แก้ไขคะแนน" : "ให้คะแนน"}
        </button>
      )}

      {editing && (
        <form onSubmit={handleSave} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            คะแนน (เต็ม {maxScore})
            <input
              type="number"
              min={0}
              max={maxScore}
              value={rawScore}
              onChange={(e) => setRawScore(e.target.value)}
              className="block w-24 rounded-lg border border-ink/10 px-2 py-1.5 mt-1"
              required
            />
          </label>
          <label className="text-sm flex-1 min-w-[150px]">
            คอมเมนต์
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-lg border border-ink/10 px-2 py-1.5 mt-1"
            />
          </label>
          <button type="submit" disabled={saving} className="btn-sticker bg-brand-mint shadow-[0_6px_0_0_#0e9270] text-sm py-2 disabled:opacity-60">
            {saving ? "..." : "บันทึก"}
          </button>
          <button type="button" onClick={onCancel} className="text-ink/40 text-sm">
            ยกเลิก
          </button>
        </form>
      )}
    </div>
  );
}
