// app/api/bill/share/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

// Optional but good — avoid build caching issues
export const dynamic = "force-dynamic";

const client = new DynamoDBClient({
  region: process.env.MY_AWS_REGION || "ap-southeast-2",
});

const TABLE_NAME = process.env.TABLE_NAME || "BillSessions";

export async function GET(
  request: NextRequest,
  context: { params: { sessionId: string } }
) {
  const { sessionId } = context.params;

  try {
    const result = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { session_id: { S: sessionId } },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const expiresAt = new Date(result.Item.expiresAt.S);
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    return NextResponse.json({
      session_id: result.Item.session_id.S,
      billId: result.Item.billId.S,
      imageUrl: result.Item.imageUrl.S,
      expiresAt: result.Item.expiresAt.S,
    });
  } catch (error: any) {
    console.error("Error fetching share session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
