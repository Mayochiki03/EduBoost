import { uploadQuestionImage } from "../api/quizzes.js";

const TYPE_LABELS = {
  multiple_choice: "เลือกตอบข้อเดียว",
  checkbox: "เลือกตอบได้หลายข้อ",
  true_false: "ถูก/ผิด",
  short_answer: "เติมคำตอบสั้น",
};

export default function QuestionEditor({ question, index, onChange, onRemove }) {
  function update(patch) {
    onChange(index, { ...question, ...patch });
  }

  function updateOption(optIndex, value) {
    const options = [...question.options];
    options[optIndex] = value;
    update({ options });
  }

  function addOption() {
    update({ options: [...(question.options || []), ""] });
  }

  function removeOption(optIndex) {
    const options = question.options.filter((_, i) => i !== optIndex);
    // ปรับเฉลยที่อ้างอิง index ตัวเลือกที่หายไป
    const correctAnswers = question.correctAnswers
      .filter((a) => Number(a) !== optIndex)
      .map((a) => (Number(a) > optIndex ? Number(a) - 1 : Number(a)));
    update({ options, correctAnswers });
  }

  function handleTypeChange(type) {
    if (type === "true_false") {
      update({ type, options: ["ถูก", "ผิด"], correctAnswers: [] });
    } else if (type === "short_answer") {
      update({ type, options: [], correctAnswers: [""] });
    } else {
      update({ type, options: question.options?.length ? question.options : ["", ""], correctAnswers: [] });
    }
  }

  function toggleCorrectSingle(optIndex) {
    update({ correctAnswers: [optIndex] });
  }

  function toggleCorrectMulti(optIndex) {
    const exists = question.correctAnswers.map(Number).includes(optIndex);
    const correctAnswers = exists
      ? question.correctAnswers.filter((a) => Number(a) !== optIndex)
      : [...question.correctAnswers, optIndex];
    update({ correctAnswers });
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await uploadQuestionImage(file);
    update({ imageUrl: url });
  }

  return (
    <div className="bg-paper rounded-2xl p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <select
          value={question.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="rounded-xl border-2 border-ink/10 px-3 py-1.5 font-medium"
        >
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onRemove(index)} className="text-brand-coral font-semibold text-sm">
          ลบข้อนี้
        </button>
      </div>

      <textarea
        value={question.questionText}
        onChange={(e) => update({ questionText: e.target.value })}
        placeholder={`คำถามข้อที่ ${index + 1}`}
        className="w-full rounded-xl border-2 border-ink/10 px-3 py-2 mb-2"
        rows={2}
      />

      <div className="mb-2">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
        {question.imageUrl && <img src={question.imageUrl} alt="" className="mt-2 max-h-32 rounded-lg" />}
      </div>

      {(question.type === "multiple_choice" || question.type === "true_false") && (
        <div className="space-y-1.5 mb-2">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                checked={question.correctAnswers.map(Number).includes(i)}
                onChange={() => toggleCorrectSingle(i)}
              />
              {question.type === "true_false" ? (
                <span>{opt}</span>
              ) : (
                <>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`ตัวเลือก ${i + 1}`}
                    className="flex-1 rounded-lg border border-ink/10 px-2 py-1"
                  />
                  {question.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-ink/30">
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          {question.type === "multiple_choice" && (
            <button type="button" onClick={addOption} className="text-brand-blue text-sm font-semibold">
              + เพิ่มตัวเลือก
            </button>
          )}
        </div>
      )}

      {question.type === "checkbox" && (
        <div className="space-y-1.5 mb-2">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.correctAnswers.map(Number).includes(i)}
                onChange={() => toggleCorrectMulti(i)}
              />
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`ตัวเลือก ${i + 1}`}
                className="flex-1 rounded-lg border border-ink/10 px-2 py-1"
              />
              {question.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="text-ink/30">
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} className="text-brand-blue text-sm font-semibold">
            + เพิ่มตัวเลือก
          </button>
        </div>
      )}

      {question.type === "short_answer" && (
        <input
          value={question.correctAnswers[0] || ""}
          onChange={(e) => update({ correctAnswers: [e.target.value] })}
          placeholder="เฉลยคำตอบ (ตรวจแบบไม่สนตัวพิมพ์เล็ก-ใหญ่)"
          className="w-full rounded-lg border border-ink/10 px-2 py-1.5 mb-2"
        />
      )}

      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          คะแนน
          <input
            type="number"
            min={1}
            value={question.points}
            onChange={(e) => update({ points: Number(e.target.value) })}
            className="w-16 rounded-lg border border-ink/10 px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
}
