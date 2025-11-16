import { NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME || "BillSessions";

export async function POST(req: Request) {
  try {
    const { billId } = await req.json();
    if (!billId) return NextResponse.json({ error: "Missing billId" }, { status: 400 });

    const shareId = randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins

    await client.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { session_id: { S: billId } },
        UpdateExpression: "SET shareId = :sid, shareExpiresAt = :exp",
        ExpressionAttributeValues: {
          ":sid": { S: shareId },
          ":exp": { N: String(expiresAt) },
        },
      })
    );

    const link = `${process.env.NEXT_PUBLIC_API_BASE_URL}/join/${shareId}`;
    return NextResponse.json({ link, expiresAt });
  } catch (err) {
    console.error("Error generating link:", err);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}
