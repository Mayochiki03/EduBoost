import { verifyToken } from "../utils/authUtils.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "ไม่พบ token กรุณาเข้าสู่ระบบ" });
  }
  try {
    const token = header.split(" ")[1];
    req.user = verifyToken(token); // { id, role, classroomId? }
    next();
  } catch (err) {
    return res.status(401).json({ message: "token ไม่ถูกต้องหรือหมดอายุ" });
  }
}

// ใช้หลัง requireAuth เพื่อจำกัดเฉพาะ role ที่กำหนด
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" });
    }
    next();
  };
}
