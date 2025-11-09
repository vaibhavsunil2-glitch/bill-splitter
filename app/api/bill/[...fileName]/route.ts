// app/api/bill/[...fileName]/route.ts

import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || "BillSessions";

export async function GET(
  req: Request,
  context: { params: Promise<{ fileName: string[] }> }
) {
  try {
    // ✅ Next.js 16: unwrap params since it's a Promise
    const { fileName } = await context.params;

    if (!fileName || fileName.length === 0) {
      console.error("[API] ❌ Missing fileName parameter");
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
    }

    const joined = Array.isArray(fileName) ? fileName.join("/") : fileName;
    console.log("[API] Request for:", joined);

    const sessionId = joined.split("/")[0];
    console.log("[API] Session ID:", sessionId);

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
    const parsedItems = JSON.parse(item.items?.S || "[]");

    const response = {
      billId: item.session_id?.S,
      imageUrl: item.imageUrl?.S || "",
      items: parsedItems.map((i: any, idx: number) => ({
        id: idx + 1,
        name: i.name || "Unnamed Item",
        price: Number(i.price) || 0,
        totalQuantity: i.totalQuantity ?? 1,
      })),
      subtotal: parseFloat(item.subtotal?.N || "0"),
      tax: parseFloat(item.tax?.N || "0"),
      total: parseFloat(item.total?.N || "0"),
    };

    console.log("[API] ✅ Returning parsed bill:", sessionId);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] ❌ Error fetching DynamoDB record:", error);
    return NextResponse.json(
      { error: "Failed to fetch record", details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Optional CORS handler
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
