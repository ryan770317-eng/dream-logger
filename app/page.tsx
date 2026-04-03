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
      alert('登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-4xl"
            style={{
              background: 'rgba(124, 106, 247, 0.15)',
              border: '1px solid rgba(124, 106, 247, 0.35)',
              boxShadow: '0 0 32px rgba(124, 106, 247, 0.2)',
            }}
          >
            🌙
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            夢境記錄器
          </h1>
          <p className="mt-1.5 text-sm mono" style={{ color: 'var(--muted)' }}>
            RyanOS · Dream Logger
          </p>
        </div>

        {/* Panel */}
        <div className="panel p-6 space-y-4">
          <div>
            <label className="block text-xs mb-2 mono" style={{ color: 'var(--muted)' }}>
              USER_NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="輸入你的暱稱"
              maxLength={20}
              className="input-field text-lg"
              autoFocus
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!nickname.trim() || loading}
            className="btn-accent w-full py-3.5 text-base"
          >
            {loading ? '進入系統中...' : '進入系統 →'}
          </button>
        </div>

        <p className="text-center text-xs mt-6 mono" style={{ color: 'var(--muted)' }}>
          // 只需暱稱即可開始記錄，無需密碼
        </p>
      </div>
    </div>
  );
}
