import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME || "BillSessions";

export async function GET(
  req: Request,
  context: { params: Promise<{ fileName: string[] }> }
) {
  try {
    // MUST await params in Next.js 15+
    const { fileName } = await context.params;

    if (!fileName || fileName.length === 0) {
      console.warn("[API] Missing fileName in request");
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    // If route uses [...fileName], Next gives array -> join back into path
    const joined = Array.isArray(fileName) ? fileName.join("/") : String(fileName);
    console.log("[API] Request for:", joined);

    // Expecting S3 key like: "sessions/<sessionId>/receipts/<fileName>"
    const parts = joined.split("/");
    // parts[0] === "sessions", parts[1] === "<sessionId>"
    const sessionId = parts.length > 1 ? parts[1] : null;

    if (!sessionId) {
      console.warn("[API] Could not extract sessionId from key:", joined);
      return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
    }

    console.log("[API] Session ID:", sessionId);

    // Use GetItem (faster than Scan) - assumes your Dynamo key is session_id
    const result = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { session_id: { S: sessionId } },
      })
    );

    if (!result.Item) {
      console.warn("[API] No DynamoDB record found for:", sessionId);
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const item = result.Item;

    // TTL check if you stored ttl as unix seconds in N attribute
    const now = Math.floor(Date.now() / 1000);
    const ttl = item.ttl?.N ? Number(item.ttl.N) : null;
    if (ttl && now > ttl) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    // return parsed bill
    return NextResponse.json({
      sessionId: item.session_id.S,
      items: item.items?.S ? JSON.parse(item.items.S) : [],
      imageUrl: item.imageUrl?.S || "",
      subtotal: item.subtotal?.N ? Number(item.subtotal.N) : 0,
      tax: item.tax?.N ? Number(item.tax.N) : 0,
      total: item.total?.N ? Number(item.total.N) : 0,
    });
  } catch (e) {
    console.error("[API] Error fetching bill:", e);
    return NextResponse.json({ error: "Error fetching shared bill" }, { status: 500 });
  }
}

