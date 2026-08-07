export default function FieldInput({ label, ...props }) {
  return (
    <label className="block text-left mb-4">
      <span className="block font-display font-semibold text-ink/80 mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3 text-lg text-ink placeholder:text-ink/30 focus:border-brand-blue transition-colors"
      />
    </label>
  );
}
