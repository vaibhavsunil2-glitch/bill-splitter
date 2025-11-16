import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const region = process.env.AWS_REGION!;
    const bucket = process.env.S3_BUCKET_NAME!;
    const accessKey = process.env.AWS_ACCESS_KEY_ID!;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY!;

    if (!region || !bucket || !accessKey || !secretKey) {
      console.error("❌ Missing AWS environment variables");
      return new Response("Missing AWS configuration", { status: 500 });
    }

    // read body
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return new Response("Missing fileName or fileType", { status: 400 });
    }

    console.log("📦 Presigning for:", fileName, "type:", fileType);

    // ⭐ GENERATE SESSION ID
    const sessionId = randomUUID();

    // ⭐ BUILD CORRECT S3 KEY STRUCTURE
    const key = `sessions/${sessionId}/receipts/${Date.now()}-${fileName}`;

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    // ⭐ RETURN PRESIGNED URL
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    console.log("✅ Generated presigned URL for key:", key);

    return Response.json({
      uploadUrl,
      key,        // <-- REQUIRED by your Lambda + API/bill
      sessionId,  // <-- REQUIRED by share links
    });
  } catch (error) {
    console.error("💥 Error generating presigned URL:", error);
    return new Response("Failed to create upload URL", { status: 500 });
  }
}
