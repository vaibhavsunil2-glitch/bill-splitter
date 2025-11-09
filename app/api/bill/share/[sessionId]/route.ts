// app/api/bill/share/[sessionId]/route.ts
import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const TABLE_NAME = "BillSessions";

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params;

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
  } catch (error) {
    console.error("Error fetching share session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
