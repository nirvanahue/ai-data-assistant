import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  // Simulate SQL generation
  const sql = `-- SQL for: ${question}\nSELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days';`;
  return NextResponse.json({ sql });
} 