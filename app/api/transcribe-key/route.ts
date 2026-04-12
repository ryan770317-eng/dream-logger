import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY 未設定' }, { status: 500 });
  }
  return NextResponse.json({ key: apiKey });
}
