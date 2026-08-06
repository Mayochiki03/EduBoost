import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function comparePassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

// token payload: { id, role: "admin"|"teacher"|"student", classroomId? }
export function signToken(payload, expiresIn = "30d") {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
