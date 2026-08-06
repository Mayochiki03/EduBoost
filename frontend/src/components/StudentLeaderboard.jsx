import { useState } from "react";
import { getLeaderboardStudent } from "../api/units.js";
import Modal from "./Modal.jsx";
import GrowthImage from "./GrowthImage.jsx";

export default function StudentLeaderboard({ unitId, unitTitle }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);

  async function handleOpen() {
    const result = await getLeaderboardStudent(unitId);
    setData(result);
    setOpen(true);
  }

  return (
    <>
      <button onClick={handleOpen} className="text-brand-sun font-display font-semibold text-sm">
        🏆 ดูอันดับ
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`อันดับ: ${unitTitle}`}>
        {data && (
          <>
            {data.me && (
              <div className="flex items-center gap-4 bg-paper rounded-2xl p-4 mb-4">
                <GrowthImage stage={data.me.growthStage} size={70} />
                <div>
                  <p className="font-display font-bold text-lg">อันดับของคุณ: #{data.me.rank}</p>
                  <p className="text-sm text-ink/60">
                    {data.me.score} คะแนน • ส่งงานแล้ว {data.me.submittedCount}/{data.me.totalAssignments} ชิ้น
                  </p>
                </div>
              </div>
            )}

            <p className="font-display font-semibold text-ink/70 mb-2">🏅 5 อันดับแรก</p>
            <ol className="space-y-1.5">
              {data.topFive.map((entry) => (
                <li key={entry.studentId} className="flex items-center justify-between bg-paper rounded-xl px-3 py-2">
                  <span className="font-semibold">
                    #{entry.rank} {entry.name}
                  </span>
                  <span className="text-sm text-ink/60">{entry.score} คะแนน</span>
                </li>
              ))}
              {data.topFive.length === 0 && (
                <p className="text-ink/50 text-center py-4">ยังไม่มีข้อมูลคะแนนในหน่วยนี้</p>
              )}
            </ol>

            {data.unit.rewardTiers?.length > 0 && (
              <div className="mt-4 text-sm text-ink/60">
                <p className="font-display font-semibold text-ink/70 mb-1">🎁 รางวัล</p>
                <ul className="list-disc list-inside">
                  {data.unit.rewardTiers.map((t) => (
                    <li key={t.rank}>
                      อันดับ {t.rank}: {t.rewardLabel}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
