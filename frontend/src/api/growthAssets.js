import api from "./client.js";

export const listGrowthAssets = () => api.get("/growth-assets").then((r) => r.data);
export const deleteGrowthAsset = (level) => api.delete(`/growth-assets/${level}`).then((r) => r.data);

export function uploadGrowthAsset(level, file, label) {
  const formData = new FormData();
  formData.append("level", level);
  formData.append("image", file);
  if (label) formData.append("label", label);
  return api.post("/growth-assets", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}
