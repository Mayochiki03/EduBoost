import api from "./client.js";

export const listQuizzesByUnit = (unitId) => api.get(`/quizzes/unit/${unitId}`).then((r) => r.data);
export const getQuizForTeacher = (id) => api.get(`/quizzes/${id}`).then((r) => r.data);
export const createQuiz = (payload) => api.post("/quizzes", payload).then((r) => r.data);
export const updateQuiz = (id, payload) => api.put(`/quizzes/${id}`, payload).then((r) => r.data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`).then((r) => r.data);
export const getQuizResults = (id) => api.get(`/quizzes/${id}/results`).then((r) => r.data);

export function uploadQuestionImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return api
    .post("/quizzes/upload-question-image", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
}

// นักเรียน
export const listMyQuizzes = () => api.get("/quizzes/my").then((r) => r.data);
export const getQuizForAttempt = (id) => api.get(`/quizzes/${id}/attempt`).then((r) => r.data);
export const submitQuizAttempt = (id, answers) => api.post(`/quizzes/${id}/attempt`, { answers }).then((r) => r.data);
export const getMyQuizAttempts = (id) => api.get(`/quizzes/${id}/my-attempts`).then((r) => r.data);
