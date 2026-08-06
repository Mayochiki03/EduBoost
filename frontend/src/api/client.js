import axios from "axios";

// URL ของ backend — ตอน dev ใช้ localhost, ตอน deploy จริงเปลี่ยนเป็น URL ของ Render ผ่าน .env (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

// แนบ token อัตโนมัติทุก request ถ้ามี (เก็บ token ไว้ใน localStorage ฝั่ง client)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ถ้า token หมดอายุ/ไม่ถูกต้อง (401) ให้เด้งกลับไปหน้า login อัตโนมัติ
// สำคัญ: ต้องเช็คว่า request นั้น "เคยแนบ token" มาก่อนหรือไม่ ถึงจะถือว่าเป็นกรณี session หมดอายุ
// ถ้าไม่มี token แนบมาเลย (เช่นตอน login/เข้าห้องเรียนที่กรอกรหัสผ่านผิด) แสดงว่าเป็นแค่ error ปกติจากฟอร์ม
// ไม่ควรเด้งหน้า/รีโหลดทิ้ง เพราะจะทำให้ error message ที่ฟอร์มตั้งใจจะโชว์หายไปทันทีก่อนคนเห็น
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestHadToken = Boolean(err.config?.headers?.Authorization);
    if (err.response?.status === 401 && requestHadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
