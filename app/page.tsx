'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNickname, setNickname } from '@/lib/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const [nickname, setNicknameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = getNickname();
    if (saved) router.replace('/record');
  }, [router]);

  const handleLogin = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', trimmed);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { createdAt: serverTimestamp() });
      }
      setNickname(trimmed);
      router.push('/record');
    } catch {
      alert('連線失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-14 pb-16">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Moon */}
        <div className="moon-disc" aria-hidden />

        {/* Mission identity */}
        <div className="flex flex-col items-center gap-2 mt-8">
          <span className="mission-tag">SOMNIUM · CORE · v1.0</span>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: 34,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: '2px 0 0',
            }}
          >
            SOMNIUM <b style={{ fontWeight: 600, color: 'var(--moon)' }}>/ S-01</b>
          </h1>
          <div
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              fontWeight: 300,
              fontSize: 13,
              color: 'var(--ink-dim)',
              letterSpacing: '0.5em',
              paddingLeft: '0.5em',
            }}
          >
            夢 境 探 索 紀 錄
          </div>
        </div>

        {/* Auth panel */}
        <div className="panel w-full mt-10 p-5">
          <div className="panel-head mb-3">
            <span><span className="dot" />[ AUTH ] 請 輸 入 探 員 代 號</span>
            <span>REQ</span>
          </div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="CREW ID ⋯"
            maxLength={20}
            className="input-field"
            autoFocus
          />
          <button
            onClick={handleLogin}
            disabled={!nickname.trim() || loading}
            className="btn-primary mt-3"
          >
            {loading ? '連 線 中 ⋯' : <>啟 動 連 線 · INITIATE <span className="mono">→</span></>}
          </button>
        </div>

        <p
          className="mono mt-5 text-center"
          style={{
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          離 線 模 式 · 無 需 密 碼 · 系 統 待 命 中
        </p>
      </div>

      <style jsx>{`
        .moon-disc {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 38% 34%, #f9e6a8 0%, #e6c977 40%, #b38d38 85%, #5a4018 100%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.22) 0%, transparent 35%);
          background-blend-mode: multiply;
          position: relative;
          box-shadow:
            0 0 80px rgba(242, 217, 143, 0.18),
            0 0 140px rgba(242, 217, 143, 0.1),
            inset -18px -14px 40px rgba(0, 0, 0, 0.7);
          filter: saturate(0.9) contrast(1.05) brightness(1.05);
          animation: breathe 8s ease-in-out infinite;
        }
        .moon-disc::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-image:
            radial-gradient(circle at 28% 42%, rgba(60, 40, 10, 0.45) 0, rgba(60, 40, 10, 0.45) 4px, transparent 5px),
            radial-gradient(circle at 58% 28%, rgba(60, 40, 10, 0.35) 0, rgba(60, 40, 10, 0.35) 6px, transparent 7px),
            radial-gradient(circle at 48% 60%, rgba(60, 40, 10, 0.3) 0, rgba(60, 40, 10, 0.3) 5px, transparent 6px),
            radial-gradient(circle at 72% 55%, rgba(60, 40, 10, 0.25) 0, rgba(60, 40, 10, 0.25) 3px, transparent 4px),
            radial-gradient(circle at 38% 75%, rgba(60, 40, 10, 0.3) 0, rgba(60, 40, 10, 0.3) 4px, transparent 5px);
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        .moon-disc::after {
          content: '';
          position: absolute;
          inset: -30px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(242, 217, 143, 0.22) 0%, transparent 60%);
          z-index: -1;
          filter: blur(10px);
          pointer-events: none;
        }
        @keyframes breathe {
          0%, 100% {
            box-shadow:
              0 0 70px rgba(242, 217, 143, 0.16),
              0 0 120px rgba(242, 217, 143, 0.08),
              inset -18px -14px 40px rgba(0, 0, 0, 0.7);
          }
          50% {
            box-shadow:
              0 0 100px rgba(242, 217, 143, 0.26),
              0 0 180px rgba(242, 217, 143, 0.14),
              inset -18px -14px 40px rgba(0, 0, 0, 0.7);
          }
        }
        .mission-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.35em;
          color: var(--muted);
          text-transform: uppercase;
        }
        .mission-tag::before,
        .mission-tag::after {
          content: '';
          width: 20px;
          height: 1px;
          background: var(--whisper);
        }
      `}</style>
    </div>
  );
}
