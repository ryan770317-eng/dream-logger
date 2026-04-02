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
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🌙</div>
          <h1 className="text-3xl font-bold text-white">夢境記錄器</h1>
          <p className="text-gray-400 mt-2">用語音記錄你的夢境</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">輸入你的暱稱</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="例如：小明"
              maxLength={20}
              className="input-field text-xl py-4"
              autoFocus
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!nickname.trim() || loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xl font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? '進入中...' : '進入 →'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          只需暱稱即可開始記錄，無需密碼
        </p>
      </div>
    </div>
  );
}
