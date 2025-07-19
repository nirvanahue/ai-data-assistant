import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  // Simulate code generation
  const code = `# Python code for: ${question}\nimport pandas as pd\n# ... your data analysis code here ...`;
  return NextResponse.json({ code });
} 