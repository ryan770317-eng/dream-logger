import { NextResponse } from 'next/server';

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const checks: Record<string, string> = {
    GROQ_API_KEY: groqKey ? `set (${groqKey.slice(0, 12)}...)` : 'MISSING ❌',
    ANTHROPIC_API_KEY: anthropicKey ? `set (${anthropicKey.slice(0, 12)}...)` : 'MISSING ❌',
    NODE_ENV: process.env.NODE_ENV ?? 'unknown',
    VERCEL_ENV: process.env.VERCEL_ENV ?? 'local',
  };

  const ok = !!groqKey && !!anthropicKey;
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
