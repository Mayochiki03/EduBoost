import { google } from "googleapis";

// ใช้ Service Account ในการเขียนข้อมูลลง Google Sheet โดยไม่ต้องให้ครู login ทุกครั้ง
// ต้อง setup: สร้าง service account ใน Google Cloud, เปิด Sheets API,
// แชร์สิทธิ์แก้ไข (Editor) ของ Google Sheet เป้าหมายให้กับอีเมล service account นั้น
function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * เขียนตารางคะแนน (leaderboard) ลง Google Sheet
 * จะล้างข้อมูลเดิมในแถบ (sheetTabName) แล้วเขียนใหม่ทับทั้งหมด (ง่ายและชัวร์กว่า append ซ้ำ)
 */
export async function pushLeaderboardToSheet({ spreadsheetId, sheetTabName, unitTitle, leaderboard }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const header = ["อันดับ", "ชื่อ-สกุล", "รหัสนักเรียน", "คะแนนรวม", "งานที่ส่ง", "ระดับการเติบโต", `อัปเดตล่าสุด (${unitTitle})`];
  const rows = leaderboard.map((entry) => [
    entry.rank,
    entry.name,
    entry.studentNumber,
    entry.score,
    `${entry.submittedCount}/${entry.totalAssignments}`,
    entry.growthStage,
    new Date().toLocaleString("th-TH"),
  ]);

  const range = `${sheetTabName}!A1`;

  // เคลียร์ของเก่าก่อน กันแถวเก่าค้างถ้าจำนวนนักเรียนลดลง
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetTabName}!A:Z`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header, ...rows] },
  });
}
