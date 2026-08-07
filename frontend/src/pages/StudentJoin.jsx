import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClassroomRoster, studentJoin } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import FieldInput from "../components/FieldInput.jsx";
import GrowthBuddy from "../components/GrowthBuddy.jsx";
import { Search, UserPlus, ArrowLeft } from "lucide-react";

// ขั้นตอน: 1) กรอกรหัสห้อง  2) เลือกชื่อจากรายชื่อเดิม (กันพิมพ์ผิด) หรือกดสมัครใหม่ถ้ายังไม่เคยเข้าห้องนี้
export default function StudentJoin() {
  const [step, setStep] = useState("code"); // code | pick | register
  const [joinCode, setJoinCode] = useState("");
  const [classroomInfo, setClassroomInfo] = useState(null);
  const [roster, setRoster] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleFindClassroom(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await getClassroomRoster(joinCode.trim());
      setClassroomInfo(data.classroom);
      setRoster(data.students);
      setStep("pick");
    } catch (err) {
      if (!err.response) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend รันอยู่หรือเน็ตหลุดหรือไม่");
      } else {
        setError(err.response?.data?.message || "ไม่พบห้องเรียนนี้ ตรวจสอบรหัสห้องอีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePickExisting(student) {
    setError("");
    setSubmitting(true);
    try {
      const data = await studentJoin({ joinCode: joinCode.trim(), studentRecordId: student._id });
      await login(data.token, "student");
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "เข้าห้องเรียนไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterNew(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await studentJoin({ joinCode: joinCode.trim(), name: name.trim(), studentId: studentId.trim() });
      await login(data.token, "student");
      navigate("/student");
    } catch (err) {
      if (!err.response) {
        setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend รันอยู่หรือเน็ตหลุดหรือไม่");
      } else {
        setError(err.response?.data?.message || "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filteredRoster = roster.filter(
    (s) => s.name.includes(search) || s.studentId.includes(search)
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-brand-blue font-display font-semibold mb-6 inline-block">
          ← กลับหน้าแรก
        </Link>
        <div className="bg-white rounded-chunky shadow-sticker p-8">
          {step === "code" && (
            <>
              <div className="flex justify-center mb-2">
                <GrowthBuddy stage={1} size={90} />
              </div>
              <h1 className="font-display text-3xl font-bold text-ink mb-1 text-center">เข้าห้องเรียน</h1>
              <p className="text-ink/60 mb-6 text-center">กรอกรหัสห้องจากครูก่อนเลย</p>
              <form onSubmit={handleFindClassroom}>
                <FieldInput
                  label="รหัสห้องเรียน"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="เช่น 123456"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
                {error && (
                  <p className="text-brand-coral font-medium mb-4 bg-brand-coral/10 rounded-xl px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
                  {submitting ? "กำลังค้นหา..." : "ถัดไป →"}
                </button>
              </form>
            </>
          )}

          {step === "pick" && (
            <>
              <button
                onClick={() => {
                  setStep("code");
                  setError("");
                }}
                className="text-ink/40 text-sm mb-3 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} /> เปลี่ยนรหัสห้อง
              </button>
              <h1 className="font-display text-2xl font-bold text-ink mb-1">{classroomInfo?.subjectName}</h1>
              <p className="text-ink/60 mb-4">{classroomInfo?.gradeLevel} • เลือกชื่อของคุณ</p>

              {roster.length > 0 && (
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อหรือเลขที่..."
                    className="w-full rounded-2xl border-2 border-ink/10 bg-white pl-9 pr-4 py-2.5"
                  />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-1.5 mb-4">
                {filteredRoster.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handlePickExisting(s)}
                    disabled={submitting}
                    className="w-full text-left rounded-2xl border-2 border-ink/10 px-4 py-2.5 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors disabled:opacity-60"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-ink/40 text-sm ml-2">เลขที่ {s.studentId}</span>
                  </button>
                ))}
                {roster.length === 0 && (
                  <p className="text-ink/40 text-sm text-center py-4">ยังไม่มีใครเคยเข้าห้องนี้เลย เป็นคนแรกได้เลย!</p>
                )}
                {roster.length > 0 && filteredRoster.length === 0 && (
                  <p className="text-ink/40 text-sm text-center py-4">ไม่พบชื่อที่ค้นหา</p>
                )}
              </div>

              {error && (
                <p className="text-brand-coral font-medium mb-4 bg-brand-coral/10 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                onClick={() => {
                  setStep("register");
                  setError("");
                }}
                className="w-full text-center text-brand-blue font-display font-semibold text-sm inline-flex items-center justify-center gap-1.5 py-2"
              >
                <UserPlus size={16} /> ไม่เจอชื่อฉัน / ยังไม่เคยเข้าห้องนี้
              </button>
            </>
          )}

          {step === "register" && (
            <>
              <button
                onClick={() => {
                  setStep("pick");
                  setError("");
                }}
                className="text-ink/40 text-sm mb-3 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} /> กลับไปเลือกจากรายชื่อ
              </button>
              <h1 className="font-display text-2xl font-bold text-ink mb-1">สมัครเข้าห้องครั้งแรก</h1>
              <p className="text-ink/60 mb-6 text-sm">กรอกให้ถูกต้อง ตรวจสอบอีกครั้งก่อนกดยืนยัน (พิมพ์ผิดจะกลายเป็นอีกบัญชีทันที)</p>
              <form onSubmit={handleRegisterNew}>
                <FieldInput label="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สมชาย ใจดี" required />
                <FieldInput
                  label="เลขประจำตัวนักเรียน"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 12345"
                  required
                />
                {error && (
                  <p className="text-brand-coral font-medium mb-4 bg-brand-coral/10 rounded-xl px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={submitting} className="btn-sticker w-full bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] disabled:opacity-60">
                  {submitting ? "กำลังสมัคร..." : "ยืนยันและเข้าห้องเรียน 🚪"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
