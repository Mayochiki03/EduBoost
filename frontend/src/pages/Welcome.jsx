import { Link } from "react-router-dom";
import GrowthBuddy from "../components/GrowthBuddy.jsx";

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <p className="font-display text-brand-violet font-semibold tracking-wide mb-2">
          ยินดีต้อนรับสู่
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-extrabold text-ink mb-3">EduBoost</h1>
        <p className="text-brand-blue font-display font-semibold mb-1">เว็บไซต์บูสต์พลังการเรียนรู้</p>
        <p className="text-ink/70 text-lg mb-10">
          ส่งงาน ทำแบบทดสอบ และดูต้นไม้ของคุณเติบโตไปพร้อมกับห้องเรียน
        </p>

        <div className="flex justify-center mb-10">
          <GrowthBuddy stage={3} size={150} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-xl mx-auto">
          <Link
            to="/join"
            className="btn-sticker bg-brand-blue shadow-[0_6px_0_0_#1d4ed8] text-lg py-5"
          >
            🎒 สำหรับนักเรียน
          </Link>
          <Link
            to="/login"
            className="btn-sticker bg-brand-violet shadow-[0_6px_0_0_#6d28d9] text-lg py-5"
          >
            🧑‍🏫 สำหรับครู
          </Link>
        </div>
      </div>
    </div>
  );
}
