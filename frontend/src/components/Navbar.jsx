import { Link } from "react-router-dom";

const ROLE_LABELS = { admin: "แอดมิน", teacher: "ครู", student: "นักเรียน" };
const ROLE_COLORS = {
  admin: "bg-brand-violet/15 text-brand-violet",
  teacher: "bg-brand-blue/15 text-brand-blue",
  student: "bg-brand-mint/15 text-brand-mint",
};

export default function Navbar({ homeLink, name, role, onLogout, rightExtra }) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink/5 mb-8">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <Link to={homeLink} className="flex items-center gap-2 font-display font-extrabold text-lg text-ink shrink-0">
          <span className="text-2xl leading-none">🚀</span>
          <span className="hidden sm:inline">EduBoost</span>
        </Link>

        <div className="flex items-center gap-3 min-w-0">
          {rightExtra}
          {name && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-ink/80 truncate max-w-[10rem]">{name}</span>
              {role && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${ROLE_COLORS[role] || "bg-ink/10 text-ink/60"}`}>
                  {ROLE_LABELS[role] || role}
                </span>
              )}
            </div>
          )}
          {onLogout && (
            <button onClick={onLogout} className="text-brand-coral font-display font-semibold text-sm whitespace-nowrap">
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
