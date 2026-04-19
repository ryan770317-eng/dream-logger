'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getNickname, clearNickname } from '@/lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RecordButton from '@/components/RecordButton';
import PreviewModal from '@/components/PreviewModal';
import { DreamAnalysis } from '@/lib/types';
import { saveRecording, loadRecordings, deleteRecording } from '@/lib/recordingDb';

interface PendingRecording {
  id: string;
  blob: Blob;
  timestamp: Date;
  duration: number;
  status: 'pending' | 'processing' | 'error';
  error?: string;
}

interface PreviewData {
  analysis: DreamAnalysis;
  transcript: string;
  recordingId: string;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hhmm = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (d.getTime() === today.getTime()) return `今天 ${hhmm}`;
  if (d.getTime() === yesterday.getTime()) return `昨天 ${hhmm}`;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd} ${hhmm}`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<PendingRecording[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const nick = getNickname();
    if (!nick) router.replace('/');
    else setUserId(nick);
  }, [router]);

  useEffect(() => {
    loadRecordings().then((saved) => {
      if (saved.length > 0) {
        setRecordings((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newOnes = saved
            .filter((s) => !existingIds.has(s.id))
            .map((s) => ({ ...s, status: 'pending' as const }));
          return [...newOnes, ...prev];
        });
      }
    }).catch(() => {});
  }, []);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    const id = String(Date.now());
    const timestamp = new Date();
    setRecordings((prev) => [
      { id, blob, timestamp, duration, status: 'pending' },
      ...prev,
    ]);
    saveRecording(id, blob, timestamp, duration).catch(() => {});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = String(Date.now());
    const timestamp = new Date();
    const estimatedDuration = Math.round(file.size / 2000);
    const blob = new Blob([file], { type: file.type });
    setRecordings((prev) => [
      { id, blob, timestamp, duration: estimatedDuration, status: 'pending' },
      ...prev,
    ]);
    saveRecording(id, blob, timestamp, estimatedDuration).catch(() => {});
    e.target.value = '';
  };

  const handleAnalyze = async (id: string) => {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;

    setRecordings((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'processing', error: undefined } : r)
    );

    try {
      const keyRes = await fetch('/api/transcribe-key');
      if (!keyRes.ok) throw new Error('無法取得 API 金鑰');
      const { key: groqKey } = await keyRes.json();

      const ext = rec.blob.type.includes('mp4') || rec.blob.type.includes('m4a') ? 'audio.m4a'
        : rec.blob.type.includes('ogg') ? 'audio.ogg'
        : 'audio.webm';
      const formData = new FormData();
      formData.append('file', rec.blob, ext);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'zh');
      formData.append('response_format', 'json');

      const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}` },
        body: formData,
      });
      if (!transcribeRes.ok) {
        const e = await transcribeRes.json().catch(() => ({}));
        throw new Error((e.error?.message || e.error || '語音辨識失敗'));
      }
      const { text: transcript } = await transcribeRes.json();

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!analyzeRes.ok) {
        const e = await analyzeRes.json().catch(() => ({}));
        throw new Error((e.error || '夢境分析失敗') + (e.detail ? ` (${e.detail})` : ''));
      }
      const analysis: DreamAnalysis = await analyzeRes.json();

      setRecordings((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r)
      );
      setPreviewData({ analysis, transcript, recordingId: id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '發生錯誤';
      setRecordings((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'error', error: msg } : r)
      );
    }
  };

  const handleDelete = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    deleteRecording(id).catch(() => {});
  };

  const handleSave = async (editedAnalysis: DreamAnalysis, editedTranscript: string) => {
    if (!userId || !previewData) return;
    setIsSaving(true);
    try {
      const cleanedAnalysis = Object.fromEntries(
        Object.entries(editedAnalysis).filter(([, v]) => v !== undefined && v !== '')
      );
      await addDoc(collection(db, 'dreams'), {
        userId,
        createdAt: serverTimestamp(),
        transcript: editedTranscript,
        ...cleanedAnalysis,
      });
      handleDelete(previewData.recordingId);
      setPreviewData(null);
      router.push('/dreams');
    } catch {
      alert('封存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearNickname();
    router.push('/');
  };

  if (!userId) return null;

  const hasQueue = recordings.length > 0;
  const crewLabel = userId.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      {/* App header */}
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(6,6,15,0.6)',
          borderBottom: '1px solid var(--hair)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <button
          onClick={() => router.push('/dreams')}
          className="zh"
          style={{ fontSize: 12.5, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}
        >
          ⌕ 任 務 檔 案
        </button>
        <span
          className="mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--moon)',
            fontWeight: 500,
            letterSpacing: '0.08em',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--moon)',
              boxShadow: '0 0 8px var(--moon-glow)',
            }}
          />
          CREW · {crewLabel}
        </span>
        <button
          onClick={handleLogout}
          className="zh"
          style={{ fontSize: 12.5, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}
        >
          斷 線
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-10 gap-6 w-full max-w-md mx-auto">
        {/* Record head */}
        <div className="text-center">
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 300,
              fontSize: 24,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            開啟新的<b style={{ fontWeight: 600, color: 'var(--moon)' }}>，探索紀錄。</b>
          </h2>
          <div
            className="zh"
            style={{
              fontWeight: 300,
              fontSize: 13,
              color: 'var(--ink-dim)',
              marginTop: 6,
              letterSpacing: '0.3em',
              paddingLeft: '0.3em',
            }}
          >
            按下 REC，開始擷取
          </div>
          <span
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              fontSize: 9.5,
              color: 'var(--muted)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 18, height: 1, background: 'var(--whisper)' }} />
            系 統 就 緒 · READY
            <span style={{ width: 18, height: 1, background: 'var(--whisper)' }} />
          </span>
        </div>

        <RecordButton onRecordingComplete={handleRecordingComplete} compact={hasQueue} />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="zh"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--ink-dim)',
            letterSpacing: '0.08em',
            padding: '9px 18px',
            border: '1px solid var(--border-soft)',
            borderRadius: 100,
            background: 'transparent',
            transition: 'all 0.25s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 15V3m0 0l-4 4m4-4l4 4" />
            <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
          匯 入 音 檔 / UPLOAD
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {hasQueue && (
          <>
            <div
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                marginTop: 4,
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
              <span>待 處 理 佇 列 · QUEUE {String(recordings.length).padStart(2, '0')}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {recordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  onAnalyze={handleAnalyze}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {previewData && (
        <PreviewModal
          transcript={previewData.transcript}
          analysis={previewData.analysis}
          onSave={handleSave}
          onDiscard={() => setPreviewData(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function RecordingCard({
  rec,
  onAnalyze,
  onDelete,
}: {
  rec: PendingRecording;
  onAnalyze: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const dotClass = rec.status === 'processing' ? 'rec-dot processing'
    : rec.status === 'error' ? 'rec-dot error'
    : 'rec-dot';

  const statusText = rec.status === 'processing' ? '傳 輸 中 / TRANSMITTING'
    : rec.status === 'error' ? '錯 誤 / ERROR'
    : '待 解 析 / READY';

  const download = () => {
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement('a');
    const ext = rec.blob.type.includes('mp4') || rec.blob.type.includes('m4a') ? 'm4a'
      : rec.blob.type.includes('ogg') ? 'ogg' : 'webm';
    a.href = url;
    a.download = `dream-${rec.id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rec-card ${rec.status === 'error' ? 'error' : ''}`}>
      <span className={dotClass} />
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 14,
            color: 'var(--ink)',
          }}
        >
          {formatTimestamp(rec.timestamp)}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: '0.12em',
            marginTop: 3,
          }}
        >
          {formatDuration(rec.duration)} · {statusText}
        </div>
        {rec.status === 'error' && rec.error && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--danger)',
              marginTop: 4,
              wordBreak: 'break-all',
              fontFamily: 'Noto Sans TC, sans-serif',
            }}
          >
            {rec.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rec.status === 'processing' ? (
          <span className="processing-label">解析中</span>
        ) : (
          <>
            <button
              type="button"
              className="btn-icon"
              title="下載音檔"
              onClick={download}
            >
              ↓
            </button>
            {rec.status === 'pending' && (
              <button type="button" className="btn-gold-sm" onClick={() => onAnalyze(rec.id)}>
                解　析
              </button>
            )}
            {rec.status === 'error' && (
              <button
                type="button"
                onClick={() => onAnalyze(rec.id)}
                className="btn-gold-sm"
                style={{
                  background: 'rgba(224,138,136,0.15)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(224,138,136,0.4)',
                  boxShadow: 'none',
                }}
              >
                重　試
              </button>
            )}
            <button
              type="button"
              className="btn-icon"
              title="刪除"
              onClick={() => onDelete(rec.id)}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
