import Unit from "../models/Unit.js";
import Classroom from "../models/Classroom.js";
import Assignment from "../models/Assignment.js";
import Quiz from "../models/Quiz.js";

// helper: เช็คว่าเป็นครูเจ้าของห้องหรือแอดมิน แล้วคืนห้องเรียนกลับมา
async function getOwnedClassroom(req, classroomId) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    const err = new Error("ไม่พบห้องเรียน");
    err.status = 404;
    throw err;
  }
  if (req.user.role !== "admin" && String(classroom.teacher) !== String(req.user.id)) {
    const err = new Error("ไม่มีสิทธิ์เข้าถึงห้องเรียนนี้");
    err.status = 403;
    throw err;
  }
  return classroom;
}

export async function createUnit(req, res) {
  try {
    const { classroomId, title, order } = req.body;
    if (!classroomId || !title) {
      return res.status(400).json({ message: "กรุณาระบุห้องเรียนและชื่อหน่วย" });
    }
    await getOwnedClassroom(req, classroomId);

    const unit = await Unit.create({ title, order: order || 0, classroom: classroomId });
    res.status(201).json(unit);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "สร้างหน่วยการเรียนไม่สำเร็จ" });
  }
}

// ดึงหน่วยการเรียนทั้งหมดของห้อง เรียงตาม order
export async function listUnitsByClassroom(req, res) {
  try {
    const { classroomId } = req.params;
    await getOwnedClassroom(req, classroomId);
    const units = await Unit.find({ classroom: classroomId }).sort({ order: 1, createdAt: 1 });
    res.json(units);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ดึงข้อมูลหน่วยการเรียนไม่สำเร็จ" });
  }
}

export async function updateUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    const { title, order } = req.body;
    if (title !== undefined) unit.title = title;
    if (order !== undefined) unit.order = order;
    await unit.save();
    res.json(unit);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "แก้ไขหน่วยการเรียนไม่สำเร็จ" });
  }
}

export async function deleteUnit(req, res) {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "ไม่พบหน่วยการเรียน" });
    await getOwnedClassroom(req, unit.classroom);

    // กันลบหน่วยที่ยังมีงาน/quiz อยู่ข้างใน เพื่อไม่ให้ข้อมูลลูกค้างเป็น orphan
    const [assignmentCount, quizCount] = await Promise.all([
      Assignment.countDocuments({ unit: unit._id }),
      Quiz.countDocuments({ unit: unit._id }),
    ]);
    if (assignmentCount > 0 || quizCount > 0) {
      return res.status(400).json({
        message: `ลบไม่ได้ เพราะหน่วยนี้ยังมีงาน ${assignmentCount} ชิ้น และ quiz ${quizCount} ชุดอยู่ กรุณาลบ/ย้ายก่อน`,
      });
    }

    await unit.deleteOne();
    res.json({ message: "ลบหน่วยการเรียนเรียบร้อย" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "ลบหน่วยการเรียนไม่สำเร็จ" });
  }
}

export { getOwnedClassroom };
