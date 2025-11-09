import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({ region: "ap-southeast-2" });

export async function GET(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  const fileName = decodeURIComponent(params.fileName);
  console.log("[v0] Looking up bill for:", fileName);

  // ✅ If filename starts with "sessions/", we assume full S3 path
  // otherwise, prepend sessions/ prefix
  const parsedKey = fileName.endsWith(".json")
    ? fileName
    : fileName.includes("sessions/")
    ? `${fileName}.json`
    : `sessions/${fileName}.json`;

  console.log("[v0] Searching DynamoDB key:", parsedKey);

  try {
    const command = new GetItemCommand({
      TableName: "BillSessions",
      Key: { parsed_key: { S: parsedKey } },
    });

    const result = await dynamo.send(command);

    if (!result.Item) {
      console.log("[v0] No record found for key:", parsedKey);
      return new Response(
        JSON.stringify({ message: "Not ready yet", key: parsedKey }),
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        }
      );
    }

    const item = Object.fromEntries(
      Object.entries(result.Item).map(([k, v]: [string, any]) => [k, v.S || v.N || v])
    );

    console.log("[v0] Record found:", item);

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[v0] DynamoDB error:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch from DynamoDB",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
