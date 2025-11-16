import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = "BillSessions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { billId, imageUrl, items, subtotal, tax, total } = body;

    if (!billId || !imageUrl) {
      return NextResponse.json(
        { error: "Missing billId or imageUrl" },
        { status: 400 }
      );
    }

    // 🔥 Create session ID (final link uses this)
    const sessionId = randomUUID();

    const now = Date.now();
    const expiresAtISO = new Date(now + 15 * 60 * 1000).toISOString();
    const ttlSeconds = Math.floor(now / 1000) + 15 * 60;

    // 🔥 Save session to DynamoDB
    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          session_id: { S: sessionId },
          billId: { S: billId },
          imageUrl: { S: imageUrl },
          items: { S: JSON.stringify(items || []) },
          subtotal: { N: String(subtotal || 0) },
          tax: { N: String(tax || 0) },
          total: { N: String(total || 0) },
          createdAt: { S: new Date(now).toISOString() },
          expiresAt: { S: expiresAtISO },
          ttl: { N: ttlSeconds.toString() },
        },
      })
    );

    // 🔥 Generate correct share link (important)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || "https://bill-splitter-peach.vercel.app";

    const publicLink = `${baseUrl}/join/${sessionId}`;

    return NextResponse.json({
      success: true,
      sessionId,
      publicLink,
      expiresAt: expiresAtISO,
    });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create share session" },
      { status: 500 }
    );
  }
}
