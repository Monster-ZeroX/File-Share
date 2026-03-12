import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "sliit";

// Utility to get Presigned URL for upload
export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  // Valid for 1 hour
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

// Utility to get download / public URL
// It's exposed via custom domain so we can just construct the URL
export function getPublicUrl(key: string) {
  const domain = process.env.R2_PUBLIC_DOMAIN;
  if (!domain) {
     return `${process.env.R2_ENDPOINT}/${BUCKET_NAME}/${key}`;
  }
  return `${domain}/${key}`;
}
