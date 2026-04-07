import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY 未設定' }, { status: 500 });
    }

    // Use OpenAI SDK pointed at Groq — same API format, no extra package needed
    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: '未收到音訊檔案' }, { status: 400 });
    }

    // Groq needs a proper filename with extension so it knows the format
    const type = audioFile.type || '';
    const ext = type.includes('mp4') || type.includes('m4a') ? 'audio.m4a'
      : type.includes('ogg') ? 'audio.ogg'
      : 'audio.webm';
    const file = new File([audioFile], ext, { type: audioFile.type });

    const result = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'zh',
      response_format: 'json',
    });

    return NextResponse.json({ transcript: result.text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Transcription error:', msg);
    return NextResponse.json({ error: '語音辨識失敗', detail: msg }, { status: 500 });
  }
}
