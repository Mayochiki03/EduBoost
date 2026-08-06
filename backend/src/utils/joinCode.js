import { customAlphabet } from "nanoid";

// รหัสห้องเรียน 6 หลัก ใช้ตัวเลขล้วน อ่านง่ายสำหรับเด็ก ม.ต้น
const generateCode = customAlphabet("0123456789", 6);

export async function generateUniqueJoinCode(ClassroomModel) {
  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    exists = await ClassroomModel.exists({ joinCode: code });
  }
  return code;
}
