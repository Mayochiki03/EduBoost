import Assignment from "../models/Assignment.js";
import Unit from "../models/Unit.js";
import Submission from "../models/Submission.js";
import { getOwnedClassroom } from "./unitController.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

// ตัดสิน mediaType จากผลอัปโหลด Cloudinary — PDF ต้องเช็ค format ก่อน เพราะ Cloudinary
// จะรายงาน resourceType เป็น "image" สำหรับ PDF ด้วย (ใช้ resource_type: auto ตอนอัปโหลด)
function resolveMediaType(uploaded) {
  if (uploaded.format === "pdf") return "pdf";
  if (uploaded.resourceType === "video") return "video";
  return "image";
}

// ครูสร้างงานใหม่ในหน่วยที่กำหนด — แนบไฟล์รูป/วิดีโอประกอบได้ (ไม่บังคับ)
export async function createAssignment(req, res) {
  try {
    const { unitId, title, description, maxScore, dueDate, rubric } = req.body;
    if (!unitId || !title || !dueDate) {
      return res.status(400).json({ message: "กรุณากรอกหน่วย ชื่องาน และกำหนดส่งให้ครบ" });
    }
    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    let mediaUrl = "";
    let mediaType = "none";
    let mediaName = "";
    if (req.files?.media) {
      const uploaded = await uploadToCloudinary(req.files.media.tempFilePath, "assignments");
      mediaUrl = uploaded.url;
      mediaType = resolveMediaType(uploaded);
      mediaName = req.files.media.name;
    }

    const assignment = await Assignment.create({
      title,
      description: description || "",
      mediaUrl,
      mediaType,
      mediaName,
      unit: unitId,
      classroom: unit.classroom,
      maxScore: maxScore || 10,
      dueDate,
      rubric: rubric ? JSON.parse(rubric) : [],
    });

    res.status(201).json(assignment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "สร้างงานไม่สำเร็จ" });
  }
}

// ครูดูงานทั้งหมดในหน่วย พร้อมจำนวนคนส่งแล้ว (ใช้ในหน้าจัดการงาน)
export async function listAssignmentsByUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const assignments = await Assignment.find({ unit: unit._id }).sort({ dueDate: 1 });
    const withCounts = await Promise.all(
      assignments.map(async (a) => {
        const submittedCount = await Submission.countDocuments({ assignment: a._id });
        return { ...a.toObject(), submittedCount };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูลงานไม่สำเร็จ" });
  }
}

// นักเรียนดูงานทั้งหมดในห้องตัวเอง พร้อมสถานะว่าส่งหรือยัง (ใช้ req.user จาก token นักเรียน)
export async function listAssignmentsForStudent(req, res) {
  try {
    const classroomId = req.user.classroomId;
    const assignments = await Assignment.find({ classroom: classroomId })
      .populate("unit", "title order")
      .sort({ dueDate: 1 });

    const mySubmissions = await Submission.find({ student: req.user.id }).select(
      "assignment status score submittedAt isLate files link note teacherComment"
    );
    const submissionMap = new Map(mySubmissions.map((s) => [String(s.assignment), s]));

    const result = assignments.map((a) => ({
      ...a.toObject(),
      mySubmission: submissionMap.get(String(a._id)) || null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลงานไม่สำเร็จ", error: err.message });
  }
}

export async function getAssignment(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("unit", "title");
    if (!assignment) return res.status(404).json({ message: "ไม่พบงานนี้" });

    // นักเรียนดูได้เฉพาะงานในห้องตัวเอง / ครูต้องเป็นเจ้าของห้อง
    if (req.user.role === "student") {
      if (String(assignment.classroom) !== String(req.user.classroomId)) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงงานนี้" });
      }
    } else {
      await getOwnedClassroom(req, assignment.classroom);
    }

    res.json(assignment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "เกิดข้อผิดพลาด" });
  }
}

export async function updateAssignment(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "ไม่พบงานนี้" });
    await getOwnedClassroom(req, assignment.classroom);

    const { title, description, maxScore, dueDate, rubric } = req.body;
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (maxScore !== undefined) assignment.maxScore = maxScore;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (rubric !== undefined) assignment.rubric = typeof rubric === "string" ? JSON.parse(rubric) : rubric;

    if (req.files?.media) {
      const uploaded = await uploadToCloudinary(req.files.media.tempFilePath, "assignments");
      assignment.mediaUrl = uploaded.url;
      assignment.mediaType = resolveMediaType(uploaded);
      assignment.mediaName = req.files.media.name;
    }

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "แก้ไขงานไม่สำเร็จ" });
  }
}

export async function deleteAssignment(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "ไม่พบงานนี้" });
    await getOwnedClassroom(req, assignment.classroom);

    // ลบไฟล์งานที่นักเรียนส่งไว้ทั้งหมดออกจาก Cloudinary ก่อน แล้วค่อยลบ record
    const submissions = await Submission.find({ assignment: assignment._id });
    for (const sub of submissions) {
      for (const file of sub.files) {
        if (file.publicId) {
          await deleteFromCloudinary(file.publicId, file.resourceType).catch(() => {});
        }
      }
    }
    await Submission.deleteMany({ assignment: assignment._id });
    await assignment.deleteOne();

    res.json({ message: "ลบงานเรียบร้อย" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ลบงานไม่สำเร็จ" });
  }
}
