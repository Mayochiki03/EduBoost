import { FileText, Paperclip, Download, ExternalLink } from "lucide-react";

// แปลง Cloudinary URL ธรรมดาให้เป็นลิงก์บังคับดาวน์โหลด (เติม fl_attachment เข้าไปหลัง /upload/)
function toDownloadUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

function guessKind(resourceTypeOrMediaType, url) {
  const t = (resourceTypeOrMediaType || "").toLowerCase();
  if (t === "pdf" || url?.toLowerCase().endsWith(".pdf")) return "pdf";
  if (t === "video") return "video";
  if (t === "image") return "image";
  return "file";
}

/**
 * แสดงไฟล์แนบ 1 ไฟล์แบบดูได้จริง ไม่ใช่แค่ลิงก์ดิบๆ:
 * - รูป: แสดง thumbnail จริง กดเพื่อเปิดเต็มจอในแท็บใหม่
 * - PDF: แสดง preview ฝังในกรอบเล็กๆ พร้อมปุ่มเปิดเต็มจอ + ดาวน์โหลด
 * - วิดีโอ: เล่นในเครื่องเล่นวิดีโอได้เลย
 * - ไฟล์อื่นๆ: การ์ดไอคอนพร้อมชื่อไฟล์ + ปุ่มดาวน์โหลด
 */
export default function FileAttachment({ url, name, kind, compact = false }) {
  const resolvedKind = guessKind(kind, url);
  const downloadUrl = toDownloadUrl(url);

  if (resolvedKind === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block group">
        <div className={`rounded-2xl overflow-hidden border-2 border-ink/10 bg-paper ${compact ? "h-20 w-20" : "w-full max-h-72"}`}>
          <img src={url} alt={name || "รูปแนบ"} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
        </div>
        {!compact && (
          <p className="text-xs text-brand-blue mt-1 inline-flex items-center gap-1">
            เปิดดูขนาดเต็ม <ExternalLink size={12} />
          </p>
        )}
      </a>
    );
  }

  if (resolvedKind === "video") {
    return (
      <div className={compact ? "w-40" : "w-full"}>
        <video src={url} controls className="rounded-2xl border-2 border-ink/10 w-full max-h-72 bg-black" />
      </div>
    );
  }

  if (resolvedKind === "pdf") {
    return (
      <div className="rounded-2xl border-2 border-ink/10 overflow-hidden bg-paper">
        {!compact && <iframe src={url} title={name || "PDF"} className="w-full h-64 bg-white" />}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white">
          <span className="text-sm font-medium truncate flex items-center gap-1.5 min-w-0">
            <FileText size={16} className="shrink-0 text-brand-coral" />
            <span className="truncate">{name || "ไฟล์ PDF"}</span>
          </span>
          <div className="flex gap-3 shrink-0">
            <a href={url} target="_blank" rel="noreferrer" className="text-brand-blue text-sm font-semibold inline-flex items-center gap-1">
              <ExternalLink size={14} /> เปิดดู
            </a>
            <a href={downloadUrl} className="text-brand-mint text-sm font-semibold inline-flex items-center gap-1">
              <Download size={14} /> ดาวน์โหลด
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ไฟล์ทั่วไปที่ไม่รู้ชนิด (docx, pptx, ฯลฯ) — โชว์การ์ดพร้อมดาวน์โหลด
  return (
    <div className="flex items-center justify-between gap-2 bg-paper rounded-2xl px-4 py-3">
      <span className="text-sm font-medium truncate flex items-center gap-1.5 min-w-0">
        <Paperclip size={16} className="shrink-0 text-ink/50" />
        <span className="truncate">{name || "ไฟล์แนบ"}</span>
      </span>
      <a href={downloadUrl} className="text-brand-blue text-sm font-semibold inline-flex items-center gap-1 shrink-0">
        <Download size={14} /> ดาวน์โหลด
      </a>
    </div>
  );
}
