import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import Classroom from "../models/Classroom.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getOwnedClassroom } from "./unitController.js";

// นักเรียนส่งงาน (ไฟล์ 1 ไฟล์ขึ้นไปผ่าน field "files", หรือแนบลิงก์, หรือทั้งคู่)
// ส่งซ้ำได้ (resubmit) — ถ้ามี submission เดิมอยู่แล้วจะอัปเดตทับ ไม่สร้างซ้ำ
export async function submitAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { link, note } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "ไม่พบงานนี้" });
    if (String(assignment.classroom) !== String(req.user.classroomId)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ส่งงานนี้" });
    }

    // ต้องมีอย่างน้อยไฟล์ 1 อันหรือลิงก์ ถึงจะถือว่าส่งงาน
    const hasFiles = req.files && Object.keys(req.files).length > 0;
    if (!hasFiles && !link) {
      return res.status(400).json({ message: "กรุณาแนบไฟล์หรือลิงก์อย่างน้อย 1 อย่าง" });
    }

    // อัปโหลดไฟล์ทั้งหมดขึ้น Cloudinary (รองรับหลายไฟล์พร้อมกัน field name "files")
    const uploadedFiles = [];
    if (hasFiles) {
      const fileList = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      for (const f of fileList) {
        const uploaded = await uploadToCloudinary(f.tempFilePath, "submissions");
        uploadedFiles.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          originalName: f.name,
        });
      }
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);

    let submission = await Submission.findOne({ assignment: assignmentId, student: req.user.id });

    if (submission) {
      // resubmit: ลบไฟล์เก่าออกจาก Cloudinary ก่อน (กันขยะสะสม) แล้วแทนที่ด้วยไฟล์ใหม่ถ้ามี
      if (uploadedFiles.length > 0) {
        for (const old of submission.files) {
          if (old.publicId) await deleteFromCloudinary(old.publicId, old.resourceType).catch(() => {});
        }
        submission.files = uploadedFiles;
      }
      if (link !== undefined) submission.link = link;
      if (note !== undefined) submission.note = note;
      submission.submittedAt = now;
      submission.isLate = isLate;
      // resubmit ถือว่ายังไม่ตรวจใหม่ ต้องให้ครูตรวจซ้ำ
      submission.status = "pending";
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: req.user.id,
        files: uploadedFiles,
        link: link || "",
        note: note || "",
        submittedAt: now,
        isLate,
      });
    }

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "ส่งงานไม่สำเร็จ", error: err.message });
  }
}

// นักเรียนดูงานที่ตัวเองส่งไปแล้ว (เห็นเฉพาะของตัวเอง เห็นคะแนนตัวเอง ไม่เห็นของคนอื่น)
export async function getMySubmission(req, res) {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.assignmentId,
      student: req.user.id,
    });
    if (!submission) return res.status(404).json({ message: "ยังไม่ได้ส่งงานนี้" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ", error: err.message });
  }
}

// ครูดูงานที่ส่งมาทั้งหมดของ assignment หนึ่งชิ้น (สำหรับตรวจให้คะแนน)
export async function listSubmissionsForAssignment(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: "ไม่พบงานนี้" });
    await getOwnedClassroom(req, assignment.classroom);

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate("student", "name studentId")
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูลไม่สำเร็จ" });
  }
}

// ครูให้คะแนนงาน — คำนวณหักคะแนนส่งช้าอัตโนมัติตาม policy ของห้องเรียน
// policy.type: "none" | "fixedDeduction" (หักคะแนนคงที่) | "percentPerDay" (หัก % ต่อวันที่ส่งช้า)
export async function gradeSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id).populate("assignment");
    if (!submission) return res.status(404).json({ message: "ไม่พบงานที่ส่ง" });

    const assignment = submission.assignment;
    await getOwnedClassroom(req, assignment.classroom);

    const { rawScore, rubricScores, teacherComment } = req.body;
    if (rawScore === undefined || rawScore === null) {
      return res.status(400).json({ message: "กรุณาให้คะแนน" });
    }
    if (rawScore > assignment.maxScore) {
      return res.status(400).json({ message: `คะแนนต้องไม่เกิน ${assignment.maxScore}` });
    }

    let finalScore = rawScore;

    if (submission.isLate) {
      const classroom = await Classroom.findById(assignment.classroom);
      const policy = classroom.lateSubmissionPolicy;

      if (policy.type === "fixedDeduction") {
        finalScore = Math.max(0, rawScore - policy.value);
      } else if (policy.type === "percentPerDay") {
        const daysLate = Math.ceil(
          (new Date(submission.submittedAt) - new Date(assignment.dueDate)) / (1000 * 60 * 60 * 24)
        );
        const deductionPercent = Math.min(100, policy.value * Math.max(1, daysLate));
        finalScore = Math.max(0, rawScore - (rawScore * deductionPercent) / 100);
      }
      // policy.type === "none" -> ไม่หักคะแนน แม้จะส่งช้า
    }

    submission.score = Math.round(finalScore * 100) / 100; // ปัดทศนิยม 2 ตำแหน่ง
    submission.rubricScores = rubricScores || [];
    submission.teacherComment = teacherComment || "";
    submission.status = "graded";
    submission.gradedAt = new Date();
    await submission.save();

    res.json(submission);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ให้คะแนนไม่สำเร็จ" });
  }
}
