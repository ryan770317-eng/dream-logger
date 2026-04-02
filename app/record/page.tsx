'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNickname, clearNickname } from '@/lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RecordButton from '@/components/RecordButton';
import PreviewModal from '@/components/PreviewModal';
import { DreamAnalysis } from '@/lib/types';

type Stage = 'idle' | 'transcribing' | 'analyzing' | 'preview';

export default function RecordPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const nick = getNickname();
    if (!nick) {
      router.replace('/');
    } else {
      setUserId(nick);
    }
  }, [router]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setError('');
    setStage('transcribing');

    try {
      // 1. Transcribe
      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'audio.m4a' : 'audio.webm';
      formData.append('audio', audioBlob, ext);

      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeRes.ok) throw new Error('語音轉文字失敗');
      const { transcript: text } = await transcribeRes.json();
      setTranscript(text);

      // 2. Analyze
      setStage('analyzing');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      if (!analyzeRes.ok) throw new Error('夢境分析失敗');
      const dreamData: DreamAnalysis = await analyzeRes.json();
      setAnalysis(dreamData);
      setStage('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤');
      setStage('idle');
    }
  };

  const handleSave = async (editedAnalysis: DreamAnalysis, editedTranscript: string) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'dreams'), {
        userId,
        createdAt: serverTimestamp(),
        transcript: editedTranscript,
        ...editedAnalysis,
      });
      setStage('idle');
      setAnalysis(null);
      setTranscript('');
      router.push('/dreams');
    } catch {
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setStage('idle');
    setAnalysis(null);
    setTranscript('');
  };

  const handleLogout = () => {
    clearNickname();
    router.push('/');
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <button onClick={() => router.push('/dreams')} className="text-gray-400 text-sm">
          我的夢境
        </button>
        <span className="text-gray-300 text-sm">👋 {userId}</span>
        <button onClick={handleLogout} className="text-gray-500 text-sm">
          登出
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="text-center">
          <div className="text-5xl mb-3">🌙</div>
          <h1 className="text-2xl font-semibold text-white">記錄夢境</h1>
          <p className="text-gray-400 mt-1 text-base">按住麥克風，說出你的夢</p>
        </div>

        {stage === 'idle' && (
          <RecordButton onRecordingComplete={handleRecordingComplete} />
        )}

        {stage === 'transcribing' && (
          <StatusCard icon="🎧" text="正在轉換語音..." />
        )}

        {stage === 'analyzing' && (
          <StatusCard icon="🔮" text="AI 正在分析夢境..." />
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-2xl px-5 py-4 text-red-300 text-center max-w-xs">
            {error}
            <button onClick={() => setError('')} className="block mx-auto mt-2 text-sm underline">
              重試
            </button>
          </div>
        )}
      </main>

      {stage === 'preview' && analysis && (
        <PreviewModal
          transcript={transcript}
          analysis={analysis}
          onSave={handleSave}
          onDiscard={handleDiscard}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function StatusCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-5xl animate-pulse">{icon}</span>
      <p className="text-gray-300 text-lg">{text}</p>
    </div>
  );
}
