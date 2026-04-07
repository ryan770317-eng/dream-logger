import { NextResponse } from 'next/server';

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const checks: Record<string, string> = {
    ANTHROPIC_API_KEY: anthropicKey ? `set (${anthropicKey.slice(0, 12)}...)` : 'MISSING',
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseKey ? `set (${firebaseKey.slice(0, 10)}...)` : 'MISSING',
    NODE_ENV: process.env.NODE_ENV ?? 'unknown',
    VERCEL: process.env.VERCEL ?? 'not vercel',
    VERCEL_ENV: process.env.VERCEL_ENV ?? 'n/a',
  };

  const ok = !!anthropicKey && !!firebaseKey;
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
