import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: "backend/config/config.env" });

const r2Endpoint = process.env.R2_ENDPOINT || "";
const r2BucketName = process.env.R2_BUCKET_NAME || "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const r2PublicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

const hasR2Config = Boolean(
    r2Endpoint && r2BucketName && r2AccessKeyId && r2SecretAccessKey && r2PublicBaseUrl
);

const client = hasR2Config
    ? new S3Client({
          region: "auto",
          endpoint: r2Endpoint,
          credentials: {
              accessKeyId: r2AccessKeyId,
              secretAccessKey: r2SecretAccessKey,
          },
      })
    : null;

export const isR2Configured = () => hasR2Config;

export const uploadBufferToR2 = async ({ key, buffer, contentType = "image/webp" }) => {
    if (!hasR2Config || !client) {
        throw new Error("Cloudflare R2 is not configured");
    }
    await client.send(
        new PutObjectCommand({
            Bucket: r2BucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );
    return {
        key,
        url: `${r2PublicBaseUrl}/${key}`,
    };
};

export const deleteObjectsFromR2 = async (keys = []) => {
    if (!hasR2Config || !client) return;
    const safeKeys = Array.from(
        new Set(
            (Array.isArray(keys) ? keys : [])
                .map((k) => String(k || "").trim())
                .filter(Boolean)
        )
    );
    if (!safeKeys.length) return;

    await client.send(
        new DeleteObjectsCommand({
            Bucket: r2BucketName,
            Delete: {
                Objects: safeKeys.map((Key) => ({ Key })),
                Quiet: true,
            },
        })
    );
};
