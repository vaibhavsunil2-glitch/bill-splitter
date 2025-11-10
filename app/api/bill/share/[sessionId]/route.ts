import { NextRequest, NextResponse } from "next/server";

// Ensure this route never caches in Amplify or Vercel
export const dynamic = "force-dynamic";

// ✅ New Next.js 15+ compatible handler signature
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    // ✅ Always await params in Next.js 15+
    const { sessionId } = await context.params;

    // You can customize logic here (this is just a placeholder)
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: "Amplify-hosted Next.js API route working fine ✅",
    });
  } catch (error: any) {
    console.error("❌ Error in /api/code route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
