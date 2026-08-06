/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // โทนสี "สมุดโน้ตกลางแดด" — พื้นหลังครีมอุ่น ๆ ตัดด้วยสีสดใสแบบปากกาเน้นข้อความ
        paper: "#FBF6EC",
        ink: "#2B2438",
        brand: {
          blue: "#3B6EF6", // ปุ่มหลัก/ลิงก์
          coral: "#FF6B5B", // เตือน/ส่งช้า/highlight
          sun: "#FFC145", // ดาว/รางวัล/อันดับ 1
          mint: "#2FBF8F", // สำเร็จ/ถูกต้อง/โต
          violet: "#8B5CF6", // ครู/แอดมิน accent
        },
      },
      fontFamily: {
        display: ["'Baloo 2'", "'Prompt'", "sans-serif"], // หัวข้อ ตัวหนา กลม สนุก
        body: ["'Prompt'", "'Noto Sans Thai'", "sans-serif"], // เนื้อหา อ่านง่ายภาษาไทย
      },
      borderRadius: {
        chunky: "1.5rem",
      },
      boxShadow: {
        sticker: "0 6px 0 0 rgba(43, 36, 56, 0.15)",
      },
    },
  },
  plugins: [],
};
