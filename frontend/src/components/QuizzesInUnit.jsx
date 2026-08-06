import { useEffect, useState } from "react";
import { listQuizzesByUnit, createQuiz, updateQuiz, deleteQuiz, getQuizResults, getQuizForTeacher } from "../api/quizzes.js";
import Modal from "./Modal.jsx";
import FieldInput from "./FieldInput.jsx";
import QuestionEditor from "./QuestionEditor.jsx";

function blankQuestion() {
  return { type: "multiple_choice", questionText: "", imageUrl: "", options: ["", ""], correctAnswers: [], points: 1 };
}

export default function QuizzesInUnit({ unitId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [resultsQuiz, setResultsQuiz] = useState(null);
  const [title, setTitle] = useState("");
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [unitId]);

  async function loadQuizzes() {
    const data = await listQuizzesByUnit(unitId);
    setQuizzes(data);
  }

  function updateQuestion(index, updated) {
    const next = [...questions];
    next[index] = updated;
    setQuestions(next);
  }

  function removeQuestion(index) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function openCreateModal() {
    setEditingId(null);
    setTitle("");
    setAttemptsAllowed(1);
    setQuestions([blankQuestion()]);
    setError("");
    setModalOpen(true);
  }

  async function openEditModal(quiz) {
    const full = await getQuizForTeacher(quiz._id);
    setEditingId(full._id);
    setTitle(full.title);
    setAttemptsAllowed(full.attemptsAllowed);
    setQuestions(full.questions.map((q) => ({ ...q })));
    setError("");
    setModalOpen(true);
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setError("");
    for (const q of questions) {
      if (!q.questionText.trim()) return setError("กรุณากรอกคำถามให้ครบทุกข้อ");
      if (q.correctAnswers.length === 0 || (q.type === "short_answer" && !q.correctAnswers[0])) {
        return setError("กรุณาระบุเฉลยให้ครบทุกข้อ");
      }
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateQuiz(editingId, { title, questions, attemptsAllowed });
      } else {
        await createQuiz({ unitId, title, questions, attemptsAllowed });
      }
      setModalOpen(false);
      loadQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(quiz) {
    await updateQuiz(quiz._id, { isPublished: !quiz.isPublished });
    loadQuizzes();
  }

  async function handleDelete(quizId) {
    if (!confirm("ลบ quiz นี้? ผลการทำของนักเรียนจะถูกลบด้วย")) return;
    await deleteQuiz(quizId);
    loadQuizzes();
  }

  async function openResults(quiz) {
    const results = await getQuizResults(quiz._id);
    setResultsQuiz({ quiz, results });
  }

  return (
    <div className="mt-4 pl-2 border-l-4 border-paper">
      <div className="flex justify-between items-center mb-3">
        <p className="font-display font-semibold text-ink/70">Quiz ในหน่วยนี้</p>
        <button onClick={openCreateModal} className="text-brand-violet font-display font-semibold text-sm">
          + สร้าง Quiz
        </button>
      </div>

      {quizzes.length === 0 && <p className="text-ink/40 text-sm mb-2">ยังไม่มี quiz ในหน่วยนี้</p>}
      <ul className="space-y-2">
        {quizzes.map((q) => (
          <li key={q._id} className="flex flex-wrap items-center justify-between gap-2 bg-paper rounded-xl px-4 py-2">
            <div>
              <p className="font-semibold">
                {q.title} {q.isPublished ? <span className="text-brand-mint text-xs">● เผยแพร่แล้ว</span> : <span className="text-ink/30 text-xs">● ฉบับร่าง</span>}
              </p>
              <p className="text-xs text-ink/50">{q.questions.length} ข้อ • ทำได้ {q.attemptsAllowed} ครั้ง</p>
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => openResults(q)} className="text-brand-blue text-sm font-semibold">
                ผลคะแนน
              </button>
              <button onClick={() => openEditModal(q)} className="text-brand-violet text-sm font-semibold">
                แก้ไข
              </button>
              <button onClick={() => togglePublish(q)} className="text-brand-mint text-sm font-semibold">
                {q.isPublished ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
              </button>
              <button onClick={() => handleDelete(q._id)} className="text-brand-coral text-sm font-semibold">
                ลบ
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "แก้ไข Quiz" : "สร้าง Quiz ใหม่"}>
        <form onSubmit={handleSubmitForm}>
          <FieldInput label="ชื่อ Quiz" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <FieldInput
            label="ทำได้กี่ครั้ง"
            type="number"
            min={1}
            value={attemptsAllowed}
            onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
          />

          <p className="font-display font-semibold text-ink/80 mb-2 mt-2">คำถาม</p>
          {questions.map((q, i) => (
            <QuestionEditor key={i} question={q} index={i} onChange={updateQuestion} onRemove={removeQuestion} />
          ))}
          <button
            type="button"
            onClick={() => setQuestions([...questions, blankQuestion()])}
            className="text-brand-violet font-display font-semibold text-sm mb-4"
          >
            + เพิ่มคำถาม
          </button>

          {error && <p className="text-brand-coral font-medium mb-4">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-violet shadow-[0_6px_0_0_#6d28d9] disabled:opacity-60">
            {submitting ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "สร้าง Quiz (ยังไม่เผยแพร่)"}
          </button>
        </form>
      </Modal>

      <Modal open={!!resultsQuiz} onClose={() => setResultsQuiz(null)} title={`ผลคะแนน: ${resultsQuiz?.quiz.title || ""}`}>
        {resultsQuiz && (
          <ul className="divide-y divide-paper">
            {resultsQuiz.results.length === 0 && <p className="text-ink/50 py-4 text-center">ยังไม่มีใครทำ</p>}
            {resultsQuiz.results.map((r) => (
              <li key={r._id} className="flex justify-between py-2">
                <span>{r.student?.name}</span>
                <span className="font-semibold">
                  {r.totalScore}/{r.maxScore}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
