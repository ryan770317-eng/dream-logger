'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dream } from '@/lib/types';

interface DreamDetailProps {
  dream: Dream;
  missionIndex: number | null;
}

const RESONANCE_TYPE_OPTIONS = ['情緒呼應', '事件呼應', '人物呼應', '象徵呼應'];

function toDate(createdAt: Dream['createdAt']): Date {
  if (createdAt instanceof Date) return createdAt;
  return new Date(createdAt.seconds * 1000);
}

function formatMissionHead(createdAt: Dream['createdAt']) {
  const d = toDate(createdAt);
  const weekday = d.toLocaleDateString('zh-TW', { weekday: 'long' });
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const fullMonth = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const day = String(d.getDate()).padStart(2, '0');
  return {
    time: `${hh} : ${mm}`,
    weekday,
    date: `${year} · ${fullMonth} · ${day}`,
  };
}

function buildAnalysisCard(dream: Dream): string {
  const date = toDate(dream.createdAt);
  const dateStr = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const numbersStr = dream.numbers?.length
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
人物：${dream.characters?.length ? dream.characters.join('、') : '無'}
地點：${dream.locations?.length ? dream.locations.join('、') : '無'}
符號：${dream.symbols?.length ? dream.symbols.join('、') : '無'}
數字：${numbersStr}
標籤：${dream.tags?.length ? dream.tags.join('、') : '無'}
睡前狀態：${preSleepStr}
原始逐字稿：${dream.transcript || '無'}
事後驗證：${validationStr}
---
請從科學心理、榮格原型、中醫五行、象徵符號四個角度解析這個夢，
並告訴我這個夢可能在預示或處理什麼。`;
}

export default function DreamDetail({ dream, missionIndex }: DreamDetailProps) {
  const [copied, setCopied] = useState(false);

  const [isEditingValidation, setIsEditingValidation] = useState(false);
  const [validationDate, setValidationDate] = useState(dream.validationDate ?? '');
  const [validationContent, setValidationContent] = useState(dream.validationContent ?? '');
  const [resonanceLevel, setResonanceLevel] = useState(dream.resonanceLevel ?? 3);
  const [resonanceTypes, setResonanceTypes] = useState<string[]>(dream.resonanceTypes ?? []);
  const [isSavingValidation, setIsSavingValidation] = useState(false);
  const [savedValidation, setSavedValidation] = useState({
    validationDate: dream.validationDate,
    validationContent: dream.validationContent,
    resonanceLevel: dream.resonanceLevel,
    resonanceTypes: dream.resonanceTypes,
  });

  const head = formatMissionHead(dream.createdAt);
  const missionIdText = missionIndex !== null
    ? `#LOG · ${String(missionIndex).padStart(3, '0')}`
    : '#LOG';

  const handleCopy = async () => {
    const text = buildAnalysisCard(dream);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleResonanceType = (opt: string) => {
    setResonanceTypes((prev) =>
      prev.includes(opt) ? prev.filter((t) => t !== opt) : [...prev, opt],
    );
  };

  const handleSaveValidation = async () => {
    if (!dream.id) return;
    setIsSavingValidation(true);
    try {
      const data: Record<string, unknown> = {
        validationDate: validationDate || null,
        validationContent: validationContent || null,
        resonanceLevel,
        resonanceTypes,
      };
      await updateDoc(doc(db, 'dreams', dream.id), data);
      setSavedValidation({ validationDate, validationContent, resonanceLevel, resonanceTypes });
      setIsEditingValidation(false);
    } catch {
      alert('封存失敗，請稍後再試');
    } finally {
      setIsSavingValidation(false);
    }
  };

  const hasPreSleep = dream.preSleepBody || dream.preSleepThoughts || (dream.recentLifeThemes && dream.recentLifeThemes.length > 0);
  const hasExtra = (dream.senses && dream.senses.length > 0) || dream.dreamEnding || dream.isRecurring;

  return (
    <div className="flex flex-col gap-2.5 pt-3">
      {/* Head card */}
      <div
        className="panel"
        style={{
          padding: '14px 16px',
          borderRadius: 16,
          background: 'rgba(16,19,38,0.55)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div
          className="mono flex justify-between items-center"
          style={{
            fontSize: 9.5,
            color: 'var(--muted)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <span>
            <span style={{ color: 'var(--moon)' }}>{missionIdText}</span> · {head.weekday}
          </span>
          <span>{head.time}</span>
        </div>
        <p
          className="zh"
          style={{
            fontWeight: 500,
            fontSize: 17,
            lineHeight: 1.7,
            color: 'var(--ink)',
            margin: '0 0 10px',
          }}
        >
          {dream.summary}
        </p>
        <div
          className="mono"
          style={{
            fontSize: 9.5,
            color: 'var(--whisper)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {head.date}
        </div>
      </div>

      {/* Emotion */}
      {dream.emotion && (
        <InfoChannel ch="emo" zh="情緒" en="EMOTION">
          <div
            className="zh"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--lavender)',
              fontSize: 14,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--muted)' }}
            >
              EMO ·
            </span>
            {dream.emotion}
          </div>
        </InfoChannel>
      )}

      {/* Lucidity */}
      {dream.lucidity && (
        <InfoChannel ch="lucid" zh="清醒度" en="LUCIDITY">
          <div className="kv-row">
            <span className="k">狀態</span>
            <span className="v zh">{dream.lucidity}</span>
          </div>
        </InfoChannel>
      )}

      {/* Characters */}
      {dream.characters && dream.characters.length > 0 && (
        <InfoChannel ch="entity" zh="人物" en="ENTITIES" right={`× ${dream.characters.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {dream.characters.map((c) => (
              <span key={c} className="chip sky">{c}</span>
            ))}
          </div>
        </InfoChannel>
      )}

      {/* Locations */}
      {dream.locations && dream.locations.length > 0 && (
        <InfoChannel ch="loc" zh="地點" en="LOCATIONS" right={`× ${dream.locations.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {dream.locations.map((l) => (
              <span key={l} className="chip">{l}</span>
            ))}
          </div>
        </InfoChannel>
      )}

      {/* Symbols */}
      {dream.symbols && dream.symbols.length > 0 && (
        <InfoChannel ch="sym" zh="符號" en="SYMBOLS" right={`× ${dream.symbols.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {dream.symbols.map((s) => (
              <span key={s} className="chip lav">{s}</span>
            ))}
          </div>
        </InfoChannel>
      )}

      {/* Numbers */}
      {dream.numbers && dream.numbers.length > 0 && (
        <InfoChannel ch="num" zh="數字" en="NUMBERS">
          <div className="flex flex-col gap-1.5">
            {dream.numbers.map((n, i) => (
              <div key={i} className="number-chip">
                <span className="n">{n.value}</span>
                <span className="ctx">{n.context}</span>
              </div>
            ))}
          </div>
        </InfoChannel>
      )}

      {/* Tags */}
      {dream.tags && dream.tags.length > 0 && (
        <InfoChannel ch="tag" zh="標籤" en="TAGS">
          <div className="flex flex-wrap gap-1.5">
            {dream.tags.map((t) => (
              <span key={t} className="chip moon">{t}</span>
            ))}
          </div>
        </InfoChannel>
      )}

      {/* Pre-sleep */}
      {hasPreSleep && (
        <InfoChannel ch="pre" zh="入夢前" en="PRE-SLEEP">
          {dream.preSleepBody && (
            <div className="kv-row">
              <span className="k">身體</span>
              <span className="v zh">{dream.preSleepBody}</span>
            </div>
          )}
          {dream.preSleepThoughts && (
            <div className="kv-row">
              <span className="k">思緒</span>
              <span className="v zh">{dream.preSleepThoughts}</span>
            </div>
          )}
          {dream.recentLifeThemes && dream.recentLifeThemes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                近期主題
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dream.recentLifeThemes.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </div>
          )}
        </InfoChannel>
      )}

      {/* Extra */}
      {hasExtra && (
        <InfoChannel ch="extra" zh="補充" en="EXTRA">
          {dream.senses && dream.senses.length > 0 && (
            <>
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                強調感官
              </div>
              <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 10 }}>
                {dream.senses.map((s) => (
                  <span key={s} className="chip lav">{s}</span>
                ))}
              </div>
            </>
          )}
          {dream.dreamEnding && (
            <div className="kv-row">
              <span className="k">結尾</span>
              <span className="v zh">{dream.dreamEnding}</span>
            </div>
          )}
          {dream.isRecurring && (
            <div style={{ marginTop: 10 }}>
              <span className="chip moon">🔄 重 複 出 現 的 夢</span>
              {dream.recurringDreamRef && (
                <p
                  className="zh"
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-dim)',
                    marginTop: 8,
                  }}
                >
                  {dream.recurringDreamRef}
                </p>
              )}
            </div>
          )}
        </InfoChannel>
      )}

      {/* Transcript */}
      {dream.transcript && (
        <InfoChannel ch="trans" zh="逐字稿" en="TRANSCRIPT">
          <p
            className="zh"
            style={{
              fontSize: 12.5,
              lineHeight: 1.85,
              color: 'var(--ink-dim)',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {dream.transcript}
          </p>
        </InfoChannel>
      )}

      {/* Copy analysis packet */}
      <div className="copy-card">
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--ink)',
          }}
        >
          解析封包
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--muted)',
              letterSpacing: '0.22em',
              marginLeft: 6,
            }}
          >
            ANALYSIS PACKET
          </span>
        </div>
        <div
          className="zh"
          style={{
            fontSize: 11.5,
            color: 'var(--ink-dim)',
            margin: '4px 0 12px',
            lineHeight: 1.7,
          }}
        >
          可貼入任何 AI 模型，取得完整解析（心理 · 榮格 · 五行 · 符號）
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="btn-primary-sm w-full"
          style={
            copied
              ? {
                background: 'rgba(140,220,180,0.15)',
                color: '#8cdcb4',
                border: '1px solid rgba(140,220,180,0.4)',
                boxShadow: 'none',
              }
              : undefined
          }
        >
          {copied ? '✓ 已 複 製' : '⧉　複 製 封 包 · COPY'}
        </button>
      </div>

      {/* Validation */}
      <div className="validate-card">
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: 10 }}
        >
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ color: '#8cdcb4' }}>■</span>
            <span className="zh" style={{ fontSize: 11, letterSpacing: '0.08em', color: '#a9e6c7' }}>
              事後驗證
            </span>
            <span
              className="mono"
              style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--whisper)' }}
            >
              VALIDATE
            </span>
          </span>
          {!isEditingValidation && (
            <button
              type="button"
              onClick={() => setIsEditingValidation(true)}
              className="mono"
              style={{
                fontSize: 9.5,
                color: 'var(--moon)',
                letterSpacing: '0.22em',
                padding: '4px 10px',
                border: '1px solid var(--border)',
                borderRadius: 100,
                background: 'transparent',
              }}
            >
              {savedValidation.validationContent ? '編 輯' : '填 寫'}
            </button>
          )}
        </div>

        {!isEditingValidation ? (
          savedValidation.validationContent ? (
            <div className="flex flex-col gap-3">
              {savedValidation.validationDate && (
                <p
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em' }}
                >
                  DATE · {savedValidation.validationDate}
                </p>
              )}
              <p
                className="zh"
                style={{
                  fontSize: 13,
                  color: 'var(--ink-dim)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {savedValidation.validationContent}
              </p>
              {savedValidation.resonanceLevel && (
                <div className="resonance-bar">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`seg${n <= (savedValidation.resonanceLevel ?? 0) ? ' on' : ''}`}
                    />
                  ))}
                  <span className="lbl">RESONANCE {savedValidation.resonanceLevel}/5</span>
                </div>
              )}
              {savedValidation.resonanceTypes && savedValidation.resonanceTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {savedValidation.resonanceTypes.map((t) => (
                    <span key={t} className="chip moon">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p
              className="zh"
              style={{ fontSize: 12.5, color: 'var(--whisper)', margin: 0 }}
            >
              尚未驗證，可於夢境發生後回填
            </p>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label
                className="mono"
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                驗 證 日 期
              </label>
              <input
                type="date"
                value={validationDate}
                onChange={(e) => setValidationDate(e.target.value)}
                className="input-field"
                style={{ fontSize: 13 }}
              />
            </div>

            <div>
              <label
                className="mono"
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                驗 證 內 容
              </label>
              <textarea
                value={validationContent}
                onChange={(e) => setValidationContent(e.target.value)}
                rows={4}
                placeholder="描述夢境與現實的呼應…"
                className="input-field"
                style={{ fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div>
              <label
                className="mono"
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                呼 應 強 度 · {resonanceLevel}/5
              </label>
              <div className="resonance-bar" style={{ marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`seg${n <= resonanceLevel ? ' on' : ''}`}
                    onClick={() => setResonanceLevel(n)}
                    aria-label={`強度 ${n}`}
                    style={{ border: 'none', padding: 0 }}
                  />
                ))}
              </div>
              <div
                className="mono flex justify-between"
                style={{ fontSize: 9, color: 'var(--whisper)', letterSpacing: '0.2em' }}
              >
                <span>微 弱</span>
                <span>強 烈</span>
              </div>
            </div>

            <div>
              <label
                className="mono"
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  color: 'var(--muted)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                呼 應 類 型
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RESONANCE_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleResonanceType(opt)}
                    className={`pill-btn${resonanceTypes.includes(opt) ? ' on' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingValidation(false)}
                className="btn-secondary flex-1"
              >
                取 消
              </button>
              <button
                type="button"
                onClick={handleSaveValidation}
                disabled={isSavingValidation}
                className="btn-primary-sm flex-1"
              >
                {isSavingValidation ? '封 存 中 ⋯' : '封 存 驗 證'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoChannel({
  ch,
  zh,
  en,
  right,
  children,
}: {
  ch: 'emo' | 'lucid' | 'entity' | 'loc' | 'sym' | 'num' | 'tag' | 'pre' | 'extra' | 'trans';
  zh: string;
  en: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`info-section ch-${ch}`}>
      <div className="info-head">
        <span className="label">
          <span className="dot" />
          <span className="zh">{zh}</span>
          <span className="en">{en}</span>
        </span>
        {right && <span className="right">{right}</span>}
      </div>
      {children}
    </div>
  );
}
