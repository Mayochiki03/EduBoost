import api from "./client.js";

export const listSubmissionsForAssignment = (assignmentId) =>
  api.get(`/submissions/assignment/${assignmentId}/all`).then((r) => r.data);

export const gradeSubmission = (submissionId, payload) =>
  api.put(`/submissions/${submissionId}/grade`, payload).then((r) => r.data);

// นักเรียน
export function submitAssignment(assignmentId, { files, link, note }) {
  const formData = new FormData();
  if (files) {
    Array.from(files).forEach((f) => formData.append("files", f));
  }
  if (link) formData.append("link", link);
  if (note) formData.append("note", note);
  return api
    .post(`/submissions/assignment/${assignmentId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export const getMySubmission = (assignmentId) =>
  api.get(`/submissions/assignment/${assignmentId}/mine`).then((r) => r.data);

