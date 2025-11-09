import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      console.error("❌ Missing fileName or fileType in request");
      return new Response("Missing fileName or fileType", { status: 400 });
    }

    console.log("📦 Presigning for:", fileName, "type:", fileType);

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log("✅ Generated presigned URL:", uploadUrl);

    return Response.json({ uploadUrl });
  } catch (error) {
    console.error("💥 Error generating presigned URL:", error);
    return new Response("Failed to create upload URL", { status: 500 });
  }
}
