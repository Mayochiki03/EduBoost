import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4 py-8 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.75rem] shadow-2xl shadow-ink/20 w-full max-w-md max-h-[85vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="font-display text-xl font-bold text-ink pr-4">{title}</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-ink/40 hover:text-ink hover:bg-paper rounded-full p-1.5 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
