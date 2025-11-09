// app/api/bill/share/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const TABLE_NAME = "BillSessions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { billId, imageUrl } = body;

    if (!billId || !imageUrl) {
      return NextResponse.json({ error: "Missing billId or imageUrl" }, { status: 400 });
    }

    const sessionId = randomUUID();
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const ttl = Math.floor(now / 1000) + 15 * 60; // 15 minutes in seconds

    // Store session in DynamoDB
    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          session_id: { S: `share_${sessionId}` },
          billId: { S: billId },
          imageUrl: { S: imageUrl },
          type: { S: "share" },
          createdAt: { S: new Date(now).toISOString() },
          expiresAt: { S: expiresAt },
          ttl: { N: ttl.toString() },
        },
      })
    );

    // Generate share link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const shareLink = `${baseUrl}/session/share_${sessionId}`;

    return NextResponse.json({ shareLink, sessionId: `share_${sessionId}`, expiresAt });
  } catch (error) {
    console.error("Error creating share session:", error);
    return NextResponse.json({ error: "Failed to create share session" }, { status: 500 });
  }
}
