import { useState } from "react";
import { submitAssignment } from "../api/submissions.js";
import Modal from "./Modal.jsx";

export default function AssignmentCard({ assignment, onSubmitted }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [files, setFiles] = useState(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPastDue = new Date() > new Date(assignment.dueDate);
  const mySub = assignment.mySubmission;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!files?.length && !link) {
      setError("แนบไฟล์หรือใส่ลิงก์อย่างน้อย 1 อย่าง");
      return;
    }
    setSubmitting(true);
    try {
      await submitAssignment(assignment._id, { files, link, note });
      setModalOpen(false);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "ส่งงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-chunky shadow-sticker p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold text-lg">{assignment.title}</p>
          {assignment.description && <p className="text-ink/60 text-sm mt-1">{assignment.description}</p>}
          <p className="text-xs text-ink/50 mt-2">
            กำหนดส่ง {new Date(assignment.dueDate).toLocaleString("th-TH")} • เต็ม {assignment.maxScore} คะแนน
          </p>
        </div>
        {assignment.mediaUrl && assignment.mediaType === "image" && (
          <img src={assignment.mediaUrl} alt="" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {mySub ? (
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              mySub.status === "graded" ? "bg-brand-mint/20 text-brand-mint" : "bg-brand-sun/20 text-amber-700"
            }`}
          >
            {mySub.status === "graded" ? `ได้คะแนน ${mySub.score}/${assignment.maxScore}` : "ส่งแล้ว รอตรวจ"}
            {mySub.isLate && " (ส่งช้า)"}
          </span>
        ) : (
          <span className={`text-sm font-semibold ${isPastDue ? "text-brand-coral" : "text-ink/40"}`}>
            {isPastDue ? "เลยกำหนดส่งแล้ว" : "ยังไม่ได้ส่ง"}
          </span>
        )}
        <button onClick={() => setModalOpen(true)} className="text-brand-blue font-display font-semibold text-sm">
          {mySub ? "ส่งใหม่" : "ส่งงาน"}
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={assignment.title}>
        <form onSubmit={handleSubmit}>
          <label className="block text-left mb-4">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">แนบไฟล์ (เลือกได้หลายไฟล์)</span>
            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
          </label>
          <label className="block text-left mb-4">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">หรือใส่ลิงก์</span>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3"
            />
          </label>
          <label className="block text-left mb-4">
            <span className="block font-display font-semibold text-ink/80 mb-1.5">หมายเหตุ (ไม่บังคับ)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3"
              rows={2}
            />
          </label>
          {error && <p className="text-brand-coral font-medium mb-4">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
            {submitting ? "กำลังส่ง..." : "ส่งงาน 🚀"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
