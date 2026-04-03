import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not set');
      return NextResponse.json({ error: 'OPENAI_API_KEY 未設定', detail: 'Missing API key' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: '音訊檔案為空或未收到' }, { status: 400 });
    }

    console.log(`Transcribing: size=${audioFile.size}, type=${audioFile.type}, name=${audioFile.name}`);

    const ext = audioFile.type.includes('webm') ? 'audio.webm'
      : audioFile.type.includes('ogg') ? 'audio.ogg'
      : 'audio.m4a';
    const fileForWhisper = new File([audioFile], ext, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file: fileForWhisper,
      model: 'whisper-1',
      language: 'zh',
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Transcription error:', msg);
    return NextResponse.json({ error: '語音辨識失敗', detail: msg }, { status: 500 });
  }
}
