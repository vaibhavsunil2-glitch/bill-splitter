// app/api/session/route.ts
import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || "BillSessions";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, billId, imageUrl, createdAt, expiresAt } = body;

    if (!sessionId || !billId) {
      console.error("❌ Missing required fields", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = {
      session_id: { S: sessionId },
      bill_id: { S: billId },
      imageUrl: { S: imageUrl || "" },
      createdAt: { S: createdAt },
      expiresAt: { S: expiresAt },
      status: { S: "active" },
    };

    await client.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    console.log("✅ Created session:", sessionId);

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
