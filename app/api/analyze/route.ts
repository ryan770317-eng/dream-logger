import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY 未設定', detail: 'Missing API key' }, { status: 500 });
    }
    const anthropic = new Anthropic({ apiKey });

    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: '未收到逐字稿' }, { status: 400 });
    }

    const prompt = `你是一個夢境分析助手。以下是用戶剛剛說出的夢境描述逐字稿，請萃取關鍵資訊並以 JSON 格式回傳。

逐字稿：
${transcript}

請回傳以下 JSON 格式，不要有任何額外文字：
{
  "summary": "一句話摘要這個夢",
  "characters": ["出現的人物1", "出現的人物2"],
  "locations": ["地點1", "地點2"],
  "emotion": "整體情緒（一個詞或短句）",
  "symbols": ["關鍵符號或意象1", "關鍵符號或意象2"],
  "numbers": [
    { "value": "數字本身", "context": "在什麼情境出現" }
  ],
  "lucidity": "清醒度描述（例：完全無意識、隱約知道在做夢、清醒夢）",
  "tags": ["標籤1", "標籤2", "標籤3"]
}

注意：
- numbers 欄位特別重要，請仔細聆聽逐字稿中出現的所有數字（門牌、電話、日期、車牌、金額等），並記錄其出現的上下文
- 若某欄位在夢境中沒有相關資訊，回傳空陣列或空字串
- tags 請自動生成 2-4 個適合用於篩選的標籤
- 請用繁體中文回答`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'AI 回應格式錯誤' }, { status: 500 });
    }

    const rawText = content.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      console.error('JSON parse error, raw text:', rawText);
      return NextResponse.json({ error: 'AI 回應格式錯誤', detail: 'Invalid JSON' }, { status: 500 });
    }
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '夢境分析失敗', detail: msg }, { status: 500 });
  }
}
