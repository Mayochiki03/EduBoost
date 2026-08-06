import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getQuizForAttempt, submitQuizAttempt } from "../api/quizzes.js";

export default function QuizAttemptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: answer }
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getQuizForAttempt(id)
      .then(setQuiz)
      .catch((err) => setError(err.response?.data?.message || "ไม่สามารถเปิด quiz นี้ได้"));
  }, [id]);

  useEffect(() => {
    if (!quiz) return;
    const q = quiz.questions[current];
    clearInterval(timerRef.current);
    if (q?.timeLimitSeconds) {
      setTimeLeft(q.timeLimitSeconds);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            goNext();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, quiz]);

  function setAnswer(value) {
    setAnswers({ ...answers, [current]: value });
  }

  function goNext() {
    if (current < quiz.questions.length - 1) {
      setCurrent(current + 1);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    clearInterval(timerRef.current);
    setSubmitting(true);
    const payload = quiz.questions.map((_, index) => ({ questionIndex: index, answer: answers[index] }));
    try {
      const data = await submitQuizAttempt(id, payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-brand-coral font-display font-semibold mb-4">{error}</p>
        <Link to="/student" className="text-brand-blue font-semibold">
          ← กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  if (!quiz) return <div className="min-h-screen flex items-center justify-center text-ink/50">กำลังโหลด...</div>;

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-chunky shadow-sticker p-8 text-center max-w-sm w-full">
          <p className="text-5xl mb-3">🎉</p>
          <h1 className="font-display text-2xl font-bold mb-2">ทำเสร็จแล้ว!</h1>
          <p className="text-3xl font-display font-extrabold text-brand-mint mb-6">
            {result.totalScore} / {result.maxScore}
          </p>
          <Link to="/student" className="btn-sticker bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] inline-block">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const q = quiz.questions[current];

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold text-ink/60">
            ข้อ {current + 1} / {quiz.questions.length}
          </p>
          {timeLeft !== null && (
            <p className={`font-display font-bold ${timeLeft <= 5 ? "text-brand-coral" : "text-ink"}`}>
              ⏱ {timeLeft} วิ
            </p>
          )}
        </div>

        <div className="bg-white rounded-chunky shadow-sticker p-6 mb-5">
          <p className="font-display text-xl font-bold mb-4">{q.questionText}</p>
          {q.imageUrl && <img src={q.imageUrl} alt="" className="rounded-2xl mb-4 max-h-56 mx-auto" />}

          {(q.type === "multiple_choice" || q.type === "true_false") && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswer(i)}
                  className={`w-full text-left rounded-2xl border-2 px-4 py-3 font-medium transition-colors ${
                    answers[current] === i ? "border-brand-blue bg-brand-blue/10" : "border-ink/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "checkbox" && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const selected = (answers[current] || []).includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const current_ = answers[current] || [];
                      setAnswer(selected ? current_.filter((x) => x !== i) : [...current_, i]);
                    }}
                    className={`w-full text-left rounded-2xl border-2 px-4 py-3 font-medium transition-colors ${
                      selected ? "border-brand-mint bg-brand-mint/10" : "border-ink/10"
                    }`}
                  >
                    {selected ? "☑" : "☐"} {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "short_answer" && (
            <input
              value={answers[current] || ""}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="พิมพ์คำตอบที่นี่"
              className="w-full rounded-2xl border-2 border-ink/10 px-4 py-3"
            />
          )}
        </div>

        <button onClick={goNext} disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
          {current === quiz.questions.length - 1 ? (submitting ? "กำลังส่ง..." : "ส่งคำตอบ") : "ข้อถัดไป →"}
        </button>
      </div>
    </div>
  );
}
