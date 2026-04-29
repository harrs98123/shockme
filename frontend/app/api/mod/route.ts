/**
 * Server-side proxy for the Moderation API.
 * Keeps MOD_API_KEY out of the browser bundle — never use NEXT_PUBLIC_ for secret keys!
 *
 * Frontend calls: POST /api/mod  { text: string }
 * This route calls the real moderation API with the secret key server-side.
 */
import { NextRequest, NextResponse } from "next/server";

// This key is only available server-side (no NEXT_PUBLIC_ prefix)
const MOD_API_KEY = process.env.MOD_API_KEY;
const MOD_API_URL = "https://api.moderationapi.com/v1/moderation";

export async function POST(request: NextRequest) {
  if (!MOD_API_KEY) {
    return NextResponse.json(
      { error: "Moderation service not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Basic validation
  const { text } = body as { text?: string };
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text field is required" }, { status: 400 });
  }

  if (text.length > 10000) {
    return NextResponse.json({ error: "text exceeds maximum allowed length" }, { status: 400 });
  }

  try {
    const response = await fetch(MOD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MOD_API_KEY}`,
      },
      body: JSON.stringify({ value: text }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[mod-proxy] Upstream error:", response.status, data);
      return NextResponse.json(
        { error: "Moderation service error" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[mod-proxy] Fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach moderation service" },
      { status: 502 }
    );
  }
}

// Block all other HTTP methods
export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
