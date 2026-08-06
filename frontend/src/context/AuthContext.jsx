import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { role: 'admin'|'teacher'|'student', ...data }
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ต้องเป็น async function และให้หน้า login/join "await" ก่อน navigate เสมอ
  // เดิมฟังก์ชันนี้เรียก refreshUser() แบบไม่รอ (fire-and-forget) แล้วหน้า login navigate ทันที
  // ทำให้บางครั้ง ProtectedRoute render ก่อนที่ state user จะอัปเดตเสร็จ เห็น user เป็น null แล้วเด้งกลับหน้าแรก
  // ทั้งที่ login สำเร็จจริง — เป็นสาเหตุของอาการ "login ไม่ได้ทั้งที่กรอกถูก" แบบเป็นบางครั้ง
  async function login(token, role) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    await refreshUser();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องถูกเรียกภายใน <AuthProvider>");
  return ctx;
}
