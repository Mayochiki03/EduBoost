import api from "./client.js";

export const listUnits = (classroomId) => api.get(`/units/classroom/${classroomId}`).then((r) => r.data);
export const createUnit = (payload) => api.post("/units", payload).then((r) => r.data);
export const updateUnit = (id, payload) => api.put(`/units/${id}`, payload).then((r) => r.data);
export const deleteUnit = (id) => api.delete(`/units/${id}`).then((r) => r.data);

export const getLeaderboardTeacher = (unitId) => api.get(`/units/${unitId}/leaderboard`).then((r) => r.data);
export const getLeaderboardStudent = (unitId) => api.get(`/units/${unitId}/leaderboard/student`).then((r) => r.data);
export const exportUnitToSheets = (unitId, payload) =>
  api.post(`/units/${unitId}/export-sheets`, payload).then((r) => r.data);
