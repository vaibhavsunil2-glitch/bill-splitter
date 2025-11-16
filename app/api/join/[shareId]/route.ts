import { NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

export const dynamic = "force-dynamic";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = process.env.TABLE_NAME || "BillSessions";

export async function GET(
  req: Request,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params;

    if (!shareId || shareId === "undefined") {
      return NextResponse.json(
        { error: "Missing or invalid shareId" },
        { status: 400 }
      );
    }

    // Search for matching shareId
    const result = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "shareId = :sid",
        ExpressionAttributeValues: {
          ":sid": { S: shareId },
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const item = result.Items[0];

    // TTL check
    const now = Math.floor(Date.now() / 1000);
    const ttl = item.shareExpiresAt?.N
      ? Number(item.shareExpiresAt.N)
      : null;

    if (ttl && now > ttl) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    return NextResponse.json({
      sessionId: item.session_id.S,
      imageUrl: item.imageUrl?.S || "",
      items: item.items?.S ? JSON.parse(item.items.S) : [],
      subtotal: item.subtotal?.N ? Number(item.subtotal.N) : 0,
      tax: item.tax?.N ? Number(item.tax.N) : 0,
      total: item.total?.N ? Number(item.total.N) : 0,
    });
  } catch (err) {
    console.error("❌ JOIN API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
