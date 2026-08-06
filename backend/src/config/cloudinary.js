import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file (from express-fileupload, req.files.file) to Cloudinary.
 * Accepts images, video, and raw files like PDF.
 * folder examples: "submissions", "assignments", "avatars"
 */
export async function uploadToCloudinary(tempFilePath, folder = "misc") {
  const result = await cloudinary.uploader.upload(tempFilePath, {
    folder: `classroom-app/${folder}`,
    resource_type: "auto", // auto-detects image / video / raw (pdf etc)
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteFromCloudinary(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
