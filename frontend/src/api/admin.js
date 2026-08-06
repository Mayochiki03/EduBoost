import api from "./client.js";

export const listTeachers = () => api.get("/auth/admin/teachers").then((r) => r.data);
export const createTeacher = (payload) => api.post("/auth/admin/teachers", payload).then((r) => r.data);
