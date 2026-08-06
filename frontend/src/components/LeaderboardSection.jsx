import { useState } from "react";
import { getLeaderboardTeacher, exportUnitToSheets } from "../api/units.js";
import Modal from "./Modal.jsx";
import FieldInput from "./FieldInput.jsx";

export default function LeaderboardSection({ unitId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sheetId, setSheetId] = useState("");
  const [sheetTab, setSheetTab] = useState("Sheet1");
  const [exportMsg, setExportMsg] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleOpen() {
    const result = await getLeaderboardTeacher(unitId);
    setData(result);
    setOpen(true);
  }

  async function handleExport(e) {
    e.preventDefault();
    setExporting(true);
    setExportMsg("");
    try {
      const res = await exportUnitToSheets(unitId, { spreadsheetId: sheetId, sheetTabName: sheetTab });
      setExportMsg(res.message);
    } catch (err) {
      setExportMsg(err.response?.data?.message || "ส่งออกไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <button onClick={handleOpen} className="text-brand-sun font-display font-semibold text-sm">
        🏆 ดูอันดับ
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`อันดับ: ${data?.unit.title || ""}`}>
        {data && (
          <>
            <ol className="space-y-1.5 mb-4">
              {data.leaderboard.map((entry) => (
                <li
                  key={entry.studentId}
                  className="flex items-center justify-between bg-paper rounded-xl px-3 py-2"
                >
                  <span className="font-semibold">
                    #{entry.rank} {entry.name}
                  </span>
                  <span className="text-sm text-ink/60">
                    {entry.score} คะแนน • ส่ง {entry.submittedCount}/{entry.totalAssignments} • โต {entry.growthStage}/10
                  </span>
                </li>
              ))}
              {data.leaderboard.length === 0 && (
                <p className="text-ink/50 text-center py-4">ยังไม่มีข้อมูลคะแนนในหน่วยนี้</p>
              )}
            </ol>
            <button
              onClick={() => setExportModalOpen(true)}
              className="btn-sticker w-full bg-brand-sun shadow-[0_6px_0_0_#b8860b] text-ink"
            >
              ส่งออกไป Google Sheets
            </button>
          </>
        )}
      </Modal>

      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="ส่งออกไป Google Sheets">
        <form onSubmit={handleExport}>
          <FieldInput
            label="Spreadsheet ID"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="ID จาก URL ของ Google Sheet"
            required
          />
          <FieldInput
            label="ชื่อแถบ (Sheet tab)"
            value={sheetTab}
            onChange={(e) => setSheetTab(e.target.value)}
            required
          />
          <p className="text-xs text-ink/50 mb-4">
            ต้องแชร์สิทธิ์แก้ไข Sheet ให้อีเมล service account ก่อน (ดูวิธีตั้งค่าใน README)
          </p>
          {exportMsg && <p className="font-medium mb-3 text-brand-mint">{exportMsg}</p>}
          <button type="submit" disabled={exporting} className="btn-sticker w-full bg-brand-sun shadow-[0_6px_0_0_#b8860b] text-ink disabled:opacity-60">
            {exporting ? "กำลังส่งออก..." : "ส่งออก"}
          </button>
        </form>
      </Modal>
    </>
  );
}
