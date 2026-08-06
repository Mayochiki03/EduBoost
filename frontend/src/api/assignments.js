import api from "./client.js";

export const listAssignmentsByUnit = (unitId) => api.get(`/assignments/unit/${unitId}`).then((r) => r.data);
export const listMyAssignments = () => api.get("/assignments/my").then((r) => r.data);
export const getAssignment = (id) => api.get(`/assignments/${id}`).then((r) => r.data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`).then((r) => r.data);

// ใช้ FormData เพราะอาจมีไฟล์รูป/วิดีโอแนบ (field name "media")
export function createAssignment(payload) {
  const formData = toFormData(payload);
  return api.post("/assignments", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function updateAssignment(id, payload) {
  const formData = toFormData(payload);
  return api.put(`/assignments/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

function toFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "rubric") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}
