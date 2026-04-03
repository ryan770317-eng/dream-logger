import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('No audio file received');
      return NextResponse.json({ error: '未收到音訊檔案' }, { status: 400 });
    }

    console.log(`Audio received: size=${audioFile.size}, type=${audioFile.type}, name=${audioFile.name}`);

    if (audioFile.size === 0) {
      return NextResponse.json({ error: '音訊檔案為空' }, { status: 400 });
    }

    // Determine the correct filename extension for Whisper
    const ext = audioFile.type.includes('webm') ? 'audio.webm'
      : audioFile.type.includes('mp4') || audioFile.type.includes('m4a') ? 'audio.m4a'
      : audioFile.type.includes('ogg') ? 'audio.ogg'
      : 'audio.m4a';

    const fileForWhisper = new File([audioFile], ext, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file: fileForWhisper,
      model: 'whisper-1',
      language: 'zh',
    });

    console.log('Transcription success:', transcription.text.substring(0, 50));
    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '語音轉文字失敗', detail: message }, { status: 500 });
  }
}
