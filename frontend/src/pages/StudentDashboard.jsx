import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listMyAssignments } from "../api/assignments.js";
import { listMyQuizzes } from "../api/quizzes.js";
import GrowthImage from "../components/GrowthImage.jsx";
import AssignmentCard from "../components/AssignmentCard.jsx";
import StudentLeaderboard from "../components/StudentLeaderboard.jsx";
import Navbar from "../components/Navbar.jsx";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [a, q] = await Promise.all([listMyAssignments(), listMyQuizzes()]);
    setAssignments(a);
    setQuizzes(q);
    setLoading(false);
  }

  // จัดกลุ่มงาน+quiz ตามหน่วยการเรียน เพื่อแสดงเป็นบล็อกต่อหน่วย พร้อมปุ่มดูอันดับของหน่วยนั้น
  const unitsMap = new Map();
  assignments.forEach((a) => {
    const key = a.unit?._id || "no-unit";
    if (!unitsMap.has(key)) unitsMap.set(key, { unit: a.unit, assignments: [], quizzes: [] });
    unitsMap.get(key).assignments.push(a);
  });
  quizzes.forEach((q) => {
    const key = q.unit?._id || "no-unit";
    if (!unitsMap.has(key)) unitsMap.set(key, { unit: q.unit, assignments: [], quizzes: [] });
    unitsMap.get(key).quizzes.push(q);
  });
  const groups = Array.from(unitsMap.values()).sort((a, b) => (a.unit?.order || 0) - (b.unit?.order || 0));

  // คำนวณ growth stage รวมคร่าวๆ ทุกหน่วย ใช้โชว์ตัวมาสคอตหัวหน้าเพจ (ตัวเลขจริงรายหน่วยดูได้ในปุ่ม "ดูอันดับ")
  const submittedTotal = assignments.filter((a) => a.mySubmission).length;
  // คำนวณ growth stage บน scale 0-10 ให้ตรงกับ GROWTH_STAGES ฝั่ง backend (v1.1)
  const overallStage = assignments.length
    ? Math.min(10, Math.ceil((submittedTotal / assignments.length) * 10))
    : 0;

  return (
    <div className="min-h-screen">
      <Navbar homeLink="/student" onLogout={logout} />
      <div className="max-w-2xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-chunky shadow-sticker p-6 mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-brand-mint/10" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <GrowthImage stage={overallStage} size={160} />
            <div>
              <p className="text-ink/50 text-sm">สวัสดี</p>
              <h1 className="font-display text-2xl font-bold">{user?.student?.name}</h1>
              <p className="text-ink/50 text-sm">{user?.classroom?.subjectName}</p>
              <p className="text-brand-mint text-sm font-semibold mt-1">ระดับการเติบโต {overallStage}/10 🌱</p>
            </div>
          </div>
        </div>

        {loading && <p className="text-ink/50 text-center py-10">กำลังโหลด...</p>}

        {!loading && groups.length === 0 && (
          <div className="bg-white rounded-chunky p-10 text-center text-ink/50">
            ยังไม่มีงานหรือ quiz ในห้องนี้ รอครูมอบหมายงานได้เลย
          </div>
        )}

        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.unit?._id || "no-unit"}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold">{g.unit?.title || "งานทั่วไป"}</h2>
                {g.unit && <StudentLeaderboard unitId={g.unit._id} unitTitle={g.unit.title} />}
              </div>

              <div className="space-y-3">
                {g.assignments.map((a) => (
                  <AssignmentCard key={a._id} assignment={a} onSubmitted={load} />
                ))}

                {g.quizzes.map((q) => (
                  <div key={q.id} className="bg-white rounded-chunky shadow-sticker p-5 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold">📝 {q.title}</p>
                      <p className="text-xs text-ink/50 mt-1">
                        {q.questionCount} ข้อ • ทำไปแล้ว {q.attemptsUsed}/{q.attemptsAllowed} ครั้ง
                        {q.bestScore !== null && ` • คะแนนดีที่สุด ${q.bestScore}`}
                      </p>
                    </div>
                    {q.attemptsUsed < q.attemptsAllowed ? (
                      <Link to={`/student/quizzes/${q.id}/attempt`} className="btn-sticker bg-brand-violet shadow-[0_4px_0_0_#6d28d9] text-sm py-2 px-4">
                        ทำ quiz
                      </Link>
                    ) : (
                      <span className="text-ink/40 text-sm font-semibold">ทำครบแล้ว</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
