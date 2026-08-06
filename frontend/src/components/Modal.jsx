export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-white rounded-chunky shadow-sticker p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="text-ink/40 hover:text-ink text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
