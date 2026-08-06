// "เพื่อนต้นไม้" (Growth Buddy) — ตัวการ์ตูนที่โตขึ้นตาม growthStage (0-5) ที่คำนวณจาก backend
// ใช้ตัวเดียวกันซ้ำได้ทั้งหน้า welcome (โชว์เฉย ๆ ที่ stage กลาง ๆ) และหน้า dashboard นักเรียน (โชว์ stage จริง)
export default function GrowthBuddy({ stage = 3, size = 140 }) {
  const clampedStage = Math.max(0, Math.min(5, stage));
  const leafCount = clampedStage; // จำนวนใบไม้ = ระดับการโต
  const potColor = "#8B5CF6";
  const stemHeight = 20 + clampedStage * 10;

  const leafPositions = [
    { x: -22, y: -10, rotate: -25 },
    { x: 22, y: -5, rotate: 25 },
    { x: -18, y: -35, rotate: -15 },
    { x: 18, y: -32, rotate: 15 },
    { x: 0, y: -50, rotate: 0 },
  ];

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={`เพื่อนต้นไม้ ระดับการเติบโต ${clampedStage} จาก 5`}
    >
      {/* กระถาง */}
      <path d="M55 120 L105 120 L98 150 Q80 156 62 150 Z" fill={potColor} />
      <rect x="52" y="112" width="56" height="12" rx="6" fill="#7C3AED" />

      {/* ลำต้น */}
      <rect x="77" y={112 - stemHeight} width="6" height={stemHeight} rx="3" fill="#2FBF8F" />

      {/* หน้ายิ้มในกระถาง (มีเสมอ แม้ stage 0 ก็ยังน่ารัก ให้กำลังใจ ไม่ทำให้เด็กรู้สึกแย่) */}
      <circle cx="72" cy="132" r="2.5" fill="#2B2438" />
      <circle cx="88" cy="132" r="2.5" fill="#2B2438" />
      <path d="M72 140 Q80 146 88 140" stroke="#2B2438" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ใบไม้ - โผล่ออกมาตามจำนวน stage */}
      {leafPositions.slice(0, leafCount).map((leaf, i) => (
        <g key={i} transform={`translate(${80 + leaf.x}, ${112 - stemHeight + leaf.y}) rotate(${leaf.rotate})`}>
          <ellipse cx="0" cy="0" rx="14" ry="8" fill="#2FBF8F" />
          <ellipse cx="0" cy="0" rx="14" ry="8" fill="#FBF6EC" opacity="0.15" />
        </g>
      ))}

      {/* ดาวระยิบระยับตอนโตเต็มที่ (stage 5) ฉลองให้พิเศษ */}
      {clampedStage === 5 && (
        <>
          <text x="30" y="30" fontSize="18">
            ✨
          </text>
          <text x="120" y="45" fontSize="14">
            ✨
          </text>
        </>
      )}
    </svg>
  );
}
