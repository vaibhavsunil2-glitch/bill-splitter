import { NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME =
  process.env.TABLE_NAME || process.env.DYNAMO_TABLE_NAME || "BillSessions";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Generate share id
    const shareId = randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

    // Save it
    await client.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { session_id: { S: sessionId } },
        UpdateExpression: "SET shareId = :sid, shareExpiresAt = :exp",
        ExpressionAttributeValues: {
          ":sid": { S: shareId },
          ":exp": { N: String(expiresAt) },
        },
      })
    );

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://bill-splitter-peach.vercel.app";

    return NextResponse.json({
      success: true,
      shareId,
      publicLink: `${base}/join/${shareId}`,
      expiresAt,
    });
  } catch (err) {
    console.error("❌ SHARE API ERROR:", err);
    return NextResponse.json({ error: "Share session failed" }, { status: 500 });
  }
}
