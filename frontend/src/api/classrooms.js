import api from "./client.js";

export const listClassrooms = () => api.get("/classrooms").then((r) => r.data);
export const getClassroom = (id) => api.get(`/classrooms/${id}`).then((r) => r.data);
export const createClassroom = (payload) => api.post("/classrooms", payload).then((r) => r.data);
export const updateClassroom = (id, payload) => api.put(`/classrooms/${id}`, payload).then((r) => r.data);
export const deleteClassroom = (id) => api.delete(`/classrooms/${id}`).then((r) => r.data);
export const listStudents = (classroomId) => api.get(`/classrooms/${classroomId}/students`).then((r) => r.data);
