import api from "./client.js";

export function loginTeacher(email, password) {
  return api.post("/auth/login", { email, password }).then((r) => r.data);
}

export function registerTeacher(payload) {
  return api.post("/auth/register", payload).then((r) => r.data);
}

export function studentJoin(joinCode, name, studentId) {
  return api.post("/auth/student-join", { joinCode, name, studentId }).then((r) => r.data);
}

export function getMe() {
  return api.get("/auth/me").then((r) => r.data);
}
