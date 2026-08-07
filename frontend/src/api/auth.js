import api from "./client.js";

export function loginTeacher(identifier, password) {
  return api.post("/auth/login", { identifier, password }).then((r) => r.data);
}

export function registerTeacher(payload) {
  return api.post("/auth/register", payload).then((r) => r.data);
}

export function getClassroomRoster(joinCode) {
  return api.get(`/auth/classroom-roster/${joinCode}`).then((r) => r.data);
}

export function studentJoin({ joinCode, studentRecordId, name, studentId }) {
  return api.post("/auth/student-join", { joinCode, studentRecordId, name, studentId }).then((r) => r.data);
}

export function getMe() {
  return api.get("/auth/me").then((r) => r.data);
}
