import Unit from "../models/Unit.js";
import { getOwnedClassroom } from "./unitController.js";
import { computeUnitScores } from "../utils/scoring.js";
import { pushLeaderboardToSheet } from "../config/googleSheets.js";

// ครูเห็นตารางคะแนนเต็ม ทุกคน ทุกคะแนน (ใช้จัดการ/ตรวจสอบ)
export async function getLeaderboardForTeacher(req, res) {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const leaderboard = await computeUnitScores(unit._id);
    res.json({ unit: { id: unit._id, title: unit.title, rewardTiers: unit.rewardTiers }, leaderboard });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูลอันดับไม่สำเร็จ" });
  }
}

// นักเรียนเห็น: อันดับ 1-5 พร้อมคะแนน (โชว์ให้ทุกคนดู ตามที่ต้องการให้มีบอร์ดจัดอันดับ)
// และเห็นอันดับ/คะแนน/ระดับการเติบโตของตัวเอง แม้จะไม่ติดอันดับ 5 แรกก็ตาม — ไม่โชว์คะแนนคนอื่นที่อยู่นอกอันดับ 5 แรก
export async function getLeaderboardForStudent(req, res) {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    if (String(unit.classroom) !== String(req.user.classroomId)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงหน่วยนี้" });
    }

    const leaderboard = await computeUnitScores(unit._id);
    const topFive = leaderboard.slice(0, 5);
    const me = leaderboard.find((e) => String(e.studentId) === String(req.user.id));

    res.json({
      unit: { id: unit._id, title: unit.title, rewardTiers: unit.rewardTiers },
      topFive,
      me: me || null,
    });
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลอันดับไม่สำเร็จ", error: err.message });
  }
}

// ครูกดส่งออกคะแนนของหน่วยนี้ไป Google Sheets (ต้องตั้งค่า service account ใน .env ก่อน)
export async function exportUnitToSheets(req, res) {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const { spreadsheetId, sheetTabName } = req.body;
    if (!spreadsheetId || !sheetTabName) {
      return res.status(400).json({ message: "กรุณาระบุ spreadsheetId และชื่อแถบ (sheetTabName)" });
    }
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return res.status(400).json({
        message: "ยังไม่ได้ตั้งค่า Google Service Account ใน .env (ดูวิธีตั้งค่าใน README)",
      });
    }

    const leaderboard = await computeUnitScores(unit._id);
    await pushLeaderboardToSheet({ spreadsheetId, sheetTabName, unitTitle: unit.title, leaderboard });

    res.json({ message: "ส่งออกคะแนนไป Google Sheets เรียบร้อย", count: leaderboard.length });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ส่งออกไป Google Sheets ไม่สำเร็จ" });
  }
}
