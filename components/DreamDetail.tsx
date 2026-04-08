'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dream } from '@/lib/types';

interface DreamDetailProps {
  dream: Dream;
}

const RESONANCE_TYPE_OPTIONS = ['情緒呼應', '事件呼應', '人物呼應', '象徵呼應'];

function formatFullDate(createdAt: Dream['createdAt']): string {
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    date = new Date(createdAt.seconds * 1000);
  }
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildAnalysisCard(dream: Dream): string {
  let date: Date;
  if (dream.createdAt instanceof Date) {
    date = dream.createdAt;
  } else {
    date = new Date((dream.createdAt as { seconds: number; nanoseconds: number }).seconds * 1000);
  }
  const dateStr = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const numbersStr = dream.numbers.length > 0
    ? dream.numbers.map((n) => `${n.value}（${n.context}）`).join('、')
    : '無';

  const preSleepParts: string[] = [];
  if (dream.preSleepBody) preSleepParts.push(dream.preSleepBody);
  if (dream.preSleepThoughts) preSleepParts.push(dream.preSleepThoughts);
  const preSleepStr = preSleepParts.length > 0 ? preSleepParts.join('／') : '未填寫';

  const validationStr = dream.validationContent?.trim() || '尚未驗證';

  return `---
🌙 夢境分析卡
時間：${dateStr}
標題：${dream.summary}
情緒：${dream.emotion || '未記錄'}
清醒度：${dream.lucidity || '未記錄'}
人物：${dream.characters.length > 0 ? dream.characters.join('、') : '無'}
地點：${dream.locations.length > 0 ? dream.locations.join('、') : '無'}
符號：${dream.symbols.length > 0 ? dream.symbols.join('、') : '無'}
數字：${numbersStr}
標籤：${dream.tags.length > 0 ? dream.tags.join('、') : '無'}
睡前狀態：${preSleepStr}
原始逐字稿：${dream.transcript || '無'}
事後驗證：${validationStr}
---
請從科學心理、榮格原型、中醫五行、象徵符號四個角度解析這個夢，
並告訴我這個夢可能在預示或處理什麼。`;
}

export default function DreamDetail({ dream }: DreamDetailProps) {
  const [copied, setCopied] = useState(false);

  // Validation edit state
  const [isEditingValidation, setIsEditingValidation] = useState(false);
  const [validationDate, setValidationDate] = useState(dream.validationDate ?? '');
  const [validationContent, setValidationContent] = useState(dream.validationContent ?? '');
  const [resonanceLevel, setResonanceLevel] = useState(dream.resonanceLevel ?? 3);
  const [resonanceTypes, setResonanceTypes] = useState<string[]>(dream.resonanceTypes ?? []);
  const [isSavingValidation, setIsSavingValidation] = useState(false);

  // Current validation data (updated on save)
  const [savedValidation, setSavedValidation] = useState({
    validationDate: dream.validationDate,
    validationContent: dream.validationContent,
    resonanceLevel: dream.resonanceLevel,
    resonanceTypes: dream.resonanceTypes,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildAnalysisCard(dream));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = buildAnalysisCard(dream);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleResonanceType = (opt: string) => {
    setResonanceTypes((prev) =>
      prev.includes(opt) ? prev.filter((t) => t !== opt) : [...prev, opt]
    );
  };

  const handleSaveValidation = async () => {
    if (!dream.id) return;
    setIsSavingValidation(true);
    try {
      const data: Record<string, unknown> = {
        validationDate: validationDate || null,
        validationContent: validationContent || null,
        resonanceLevel: resonanceLevel,
        resonanceTypes: resonanceTypes,
      };
      await updateDoc(doc(db, 'dreams', dream.id), data);
      setSavedValidation({ validationDate, validationContent, resonanceLevel, resonanceTypes });
      setIsEditingValidation(false);
    } catch {
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSavingValidation(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-400 text-sm">{formatFullDate(dream.createdAt)}</p>
        <h1 className="text-white text-2xl font-semibold mt-1 leading-snug">{dream.summary}</h1>
      </div>

      {dream.emotion && (
        <div className="flex items-center gap-2">
          <span className="text-2xl">💭</span>
          <span className="text-indigo-300 text-lg">{dream.emotion}</span>
        </div>
      )}

      {dream.lucidity && (
        <InfoSection title="清醒度" icon="🌙">
          <p className="text-gray-200">{dream.lucidity}</p>
        </InfoSection>
      )}

      {dream.characters.length > 0 && (
        <InfoSection title="出現人物" icon="👥">
          <div className="flex flex-wrap gap-2">
            {dream.characters.map((c) => (
              <Tag key={c} color="blue">{c}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.locations.length > 0 && (
        <InfoSection title="地點" icon="📍">
          <div className="flex flex-wrap gap-2">
            {dream.locations.map((l) => (
              <Tag key={l} color="green">{l}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.symbols.length > 0 && (
        <InfoSection title="符號與意象" icon="✨">
          <div className="flex flex-wrap gap-2">
            {dream.symbols.map((s) => (
              <Tag key={s} color="purple">{s}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.numbers.length > 0 && (
        <InfoSection title="出現的數字" icon="🔢">
          <div className="space-y-2">
            {dream.numbers.map((n, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                <span className="text-yellow-400 font-bold text-lg">{n.value}</span>
                <span className="text-gray-400 text-sm">{n.context}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.tags.length > 0 && (
        <InfoSection title="標籤" icon="🏷️">
          <div className="flex flex-wrap gap-2">
            {dream.tags.map((t) => (
              <Tag key={t} color="indigo">{t}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {/* 入夢前狀態 */}
      {(dream.preSleepBody || dream.preSleepThoughts || (dream.recentLifeThemes && dream.recentLifeThemes.length > 0)) && (
        <InfoSection title="入夢前狀態" icon="🛏️">
          <div className="space-y-2">
            {dream.preSleepBody && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">身體感受</span>
                <span className="text-sm px-2.5 py-1 rounded-full border border-gray-600 text-gray-300">
                  {dream.preSleepBody}
                </span>
              </div>
            )}
            {dream.preSleepThoughts && (
              <div>
                <span className="text-gray-500 text-xs block mb-1">睡前在想</span>
                <p className="text-gray-300 text-sm">{dream.preSleepThoughts}</p>
              </div>
            )}
            {dream.recentLifeThemes && dream.recentLifeThemes.length > 0 && (
              <div>
                <span className="text-gray-500 text-xs block mb-1.5">近期生活主題</span>
                <div className="flex flex-wrap gap-1.5">
                  {dream.recentLifeThemes.map((t) => (
                    <Tag key={t} color="indigo">{t}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {/* 夢境補充 */}
      {(dream.senses?.length || dream.dreamEnding || dream.isRecurring) && (
        <InfoSection title="夢境補充" icon="🔍">
          <div className="space-y-2">
            {dream.senses && dream.senses.length > 0 && (
              <div>
                <span className="text-gray-500 text-xs block mb-1.5">強調感官</span>
                <div className="flex flex-wrap gap-1.5">
                  {dream.senses.map((s) => (
                    <Tag key={s} color="purple">{s}</Tag>
                  ))}
                </div>
              </div>
            )}
            {dream.dreamEnding && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">結尾狀態</span>
                <span className="text-sm px-2.5 py-1 rounded-full border border-gray-600 text-gray-300">
                  {dream.dreamEnding}
                </span>
              </div>
            )}
            {dream.isRecurring && (
              <div>
                <span className="text-sm px-2.5 py-1 rounded-full border border-yellow-700/40 text-yellow-300 bg-yellow-900/20">
                  🔄 重複出現的夢
                </span>
                {dream.recurringDreamRef && (
                  <p className="text-gray-400 text-sm mt-2">{dream.recurringDreamRef}</p>
                )}
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {dream.transcript && (
        <InfoSection title="原始逐字稿" icon="📝">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{dream.transcript}</p>
        </InfoSection>
      )}

      {/* 複製分析卡 */}
      <div className="rounded-2xl border border-gray-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-sm font-medium">夢境分析卡</h3>
            <p className="text-gray-500 text-xs mt-0.5">複製後貼給任何 AI，即可獲得夢境解析</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
            style={{
              background: copied ? 'rgba(74,222,128,0.15)' : 'var(--accent)',
              color: copied ? 'rgb(74,222,128)' : '#0a0a08',
              border: copied ? '1px solid rgba(74,222,128,0.4)' : 'none',
            }}
          >
            {copied ? '✓ 已複製' : '📋 複製分析卡'}
          </button>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          將分析卡貼到任何一個 AI 模型，就能產出你的夢境分析，快去看看你的夢跟你說了什麼吧！
        </p>
      </div>

      {/* 事後驗證 */}
      <div className="bg-gray-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-sm flex items-center gap-1.5">
            <span>🔮</span>
            事後驗證
          </h3>
          {!isEditingValidation && (
            <button
              onClick={() => setIsEditingValidation(true)}
              className="text-xs px-3 py-1 rounded-lg border border-gray-600 text-gray-400"
            >
              {savedValidation.validationContent ? '編輯' : '填寫驗證'}
            </button>
          )}
        </div>

        {!isEditingValidation ? (
          savedValidation.validationContent ? (
            <div className="space-y-3">
              {savedValidation.validationDate && (
                <p className="text-gray-500 text-xs">驗證日期：{savedValidation.validationDate}</p>
              )}
              <p className="text-gray-200 text-sm leading-relaxed">{savedValidation.validationContent}</p>
              {savedValidation.resonanceLevel && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">呼應強度</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="text-sm"
                        style={{ opacity: n <= (savedValidation.resonanceLevel ?? 0) ? 1 : 0.2 }}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {savedValidation.resonanceTypes && savedValidation.resonanceTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {savedValidation.resonanceTypes.map((t) => (
                    <Tag key={t} color="indigo">{t}</Tag>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">尚未驗證，可於夢境發生後回填</p>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-500 text-xs mb-1.5">驗證日期</label>
              <input
                type="date"
                value={validationDate}
                onChange={(e) => setValidationDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-1.5">驗證內容</label>
              <textarea
                value={validationContent}
                onChange={(e) => setValidationContent(e.target.value)}
                rows={4}
                placeholder="描述夢境與現實的呼應…"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-2">呼應強度（{resonanceLevel}/5）</label>
              <input
                type="range"
                min={1}
                max={5}
                value={resonanceLevel}
                onChange={(e) => setResonanceLevel(Number(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>微弱</span>
                <span>強烈</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-2">呼應類型（可複選）</label>
              <div className="flex flex-wrap gap-2">
                {RESONANCE_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleResonanceType(opt)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      resonanceTypes.includes(opt)
                        ? 'border-yellow-400/60 text-yellow-300'
                        : 'border-gray-600 text-gray-400'
                    }`}
                    style={resonanceTypes.includes(opt) ? { background: 'rgba(247,247,87,0.12)' } : {}}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setIsEditingValidation(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-400 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveValidation}
                disabled={isSavingValidation}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#0a0a08' }}
              >
                {isSavingValidation ? '儲存中...' : '儲存驗證'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-4">
      <h3 className="text-gray-400 text-sm flex items-center gap-1.5 mb-3">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo';
}) {
  const colors = {
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    green: 'bg-green-900/40 text-green-300 border-green-700/40',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  };
  return (
    <span className={`text-sm px-3 py-1 rounded-full border ${colors[color]}`}>{children}</span>
  );
}
