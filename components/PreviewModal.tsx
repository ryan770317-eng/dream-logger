'use client';

import { useState } from 'react';
import { DreamAnalysis } from '@/lib/types';

interface PreviewModalProps {
  transcript: string;
  analysis: DreamAnalysis;
  onSave: (analysis: DreamAnalysis, transcript: string) => void;
  onDiscard: () => void;
  isSaving: boolean;
}

const PRE_SLEEP_BODY_OPTIONS = ['疲憊', '亢奮', '平靜', '焦慮', '其他'];
const LIFE_THEME_OPTIONS = ['工作壓力', '感情關係', '家庭', '健康', '財務', '成長', '創意', '靈性'];
const SENSE_OPTIONS = ['視覺', '聽覺', '觸覺', '嗅覺', '味覺'];
const DREAM_ENDING_OPTIONS = ['自然結束', '驚醒', '淡出', '不記得'];

export default function PreviewModal({
  transcript,
  analysis,
  onSave,
  onDiscard,
  isSaving,
}: PreviewModalProps) {
  const [edited, setEdited] = useState<DreamAnalysis>({
    ...analysis,
    preSleepBody: analysis.preSleepBody ?? '',
    preSleepThoughts: analysis.preSleepThoughts ?? '',
    recentLifeThemes: analysis.recentLifeThemes ?? [],
    senses: analysis.senses ?? [],
    dreamEnding: analysis.dreamEnding ?? '',
    isRecurring: analysis.isRecurring ?? false,
    recurringDreamRef: analysis.recurringDreamRef ?? '',
  });
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPreSleep, setShowPreSleep] = useState(false);
  const [showDreamExtra, setShowDreamExtra] = useState(false);

  const updateField = <K extends keyof DreamAnalysis>(key: K, value: DreamAnalysis[K]) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayField = (
    key: 'characters' | 'locations' | 'symbols' | 'tags' | 'recentLifeThemes',
    value: string,
  ) => {
    updateField(key, value.split('、').map((s) => s.trim()).filter(Boolean));
  };

  const toggleMultiSelect = (key: 'senses' | 'recentLifeThemes', option: string) => {
    const current = (edited[key] as string[]) ?? [];
    const next = current.includes(option)
      ? current.filter((s) => s !== option)
      : [...current, option];
    updateField(key, next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(4,4,10,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-h-[92vh] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(16,19,38,0.96) 0%, rgba(10,12,30,0.98) 100%)',
          border: '1px solid var(--border-soft)',
          borderTop: '1px solid var(--border)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(242,217,143,0.08)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 4,
            borderRadius: 4,
            background: 'var(--whisper)',
            margin: '10px auto 4px',
          }}
        />

        <div style={{ padding: '8px 22px 14px', borderBottom: '1px solid var(--hair)' }}>
          <span
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 9.5,
              color: 'var(--moon)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--moon)',
                boxShadow: '0 0 8px var(--moon-glow)',
                animation: 'twinkle 2s infinite',
              }}
            />
            ANALYSIS COMPLETE · 請 確 認 封 存
          </span>
          <h3
            style={{
              fontFamily: 'Inter, Noto Sans TC, sans-serif',
              fontWeight: 500,
              fontSize: 17,
              color: 'var(--ink)',
              margin: '6px 0 2px',
            }}
          >
            AI 已完成夢境解析
          </h3>
          <p
            className="zh"
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            可修改後儲存至檔案庫 / EDIT BEFORE ARCHIVE
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '14px 20px' }}>
          <div className="flex flex-col gap-3">
            <div className="field-block ch-sum">
              <label><span className="dot" /><span className="zh">摘要</span> SUMMARY</label>
              <textarea
                value={edited.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                rows={2}
              />
            </div>

            <div className="field-block ch-emo">
              <label><span className="dot" /><span className="zh">情緒</span> EMOTION</label>
              <input
                value={edited.emotion}
                onChange={(e) => updateField('emotion', e.target.value)}
              />
            </div>

            <div className="field-block ch-lucid">
              <label><span className="dot" /><span className="zh">清醒度</span> LUCIDITY</label>
              <input
                value={edited.lucidity}
                onChange={(e) => updateField('lucidity', e.target.value)}
              />
            </div>

            <div className="field-block ch-entity">
              <label>
                <span className="dot" /><span className="zh">人物</span> ENTITIES
                <span style={{ color: 'var(--whisper)', letterSpacing: '0.05em', textTransform: 'none', marginLeft: 4 }}>
                  （以「、」分隔）
                </span>
              </label>
              <input
                value={edited.characters.join('、')}
                onChange={(e) => updateArrayField('characters', e.target.value)}
              />
            </div>

            <div className="field-block ch-loc">
              <label><span className="dot" /><span className="zh">地點</span> LOCATIONS</label>
              <input
                value={edited.locations.join('、')}
                onChange={(e) => updateArrayField('locations', e.target.value)}
              />
            </div>

            <div className="field-block ch-sym">
              <label><span className="dot" /><span className="zh">符號</span> SYMBOLS</label>
              <input
                value={edited.symbols.join('、')}
                onChange={(e) => updateArrayField('symbols', e.target.value)}
              />
            </div>

            {edited.numbers && edited.numbers.length > 0 && (
              <div className="field-block ch-num">
                <label><span className="dot" /><span className="zh">數字</span> NUMBERS</label>
                <div className="flex flex-col gap-1.5">
                  {edited.numbers.map((n, i) => (
                    <div key={i} className="number-chip">
                      <span className="n">{n.value}</span>
                      <span className="ctx">{n.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field-block ch-tag">
              <label><span className="dot" /><span className="zh">標籤</span> TAGS</label>
              <input
                value={edited.tags.join('、')}
                onChange={(e) => updateArrayField('tags', e.target.value)}
              />
            </div>

            {/* Transcript toggle */}
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="mono"
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--ink-dim)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {showTranscript ? '隱 藏' : '查 看 / 編 輯'} 原 始 逐 字 稿
            </button>
            {showTranscript && (
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={5}
                className="input-field"
                style={{ fontSize: 12.5, resize: 'vertical' }}
              />
            )}

            {/* Pre-sleep */}
            <div className="collapse">
              <button
                type="button"
                className="collapse-head"
                onClick={() => setShowPreSleep(!showPreSleep)}
              >
                <span>
                  {showPreSleep ? '▾' : '▸'}{' '}
                  <span className="zh" style={{ fontSize: 11, letterSpacing: '0.08em', color: '#d0d3e3' }}>
                    入夢前
                  </span>{' '}
                  PRE-SLEEP
                </span>
                <span className="hint">{showPreSleep ? '收 起' : '選 填 · OPTIONAL'}</span>
              </button>
              {showPreSleep && (
                <div className="collapse-body">
                  <div>
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
                      身體狀態
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PRE_SLEEP_BODY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField('preSleepBody', edited.preSleepBody === opt ? '' : opt)}
                          className={`pill-btn${edited.preSleepBody === opt ? ' on' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
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
                      睡前主要在想的事（選填）
                    </div>
                    <input
                      value={edited.preSleepThoughts ?? ''}
                      onChange={(e) => updateField('preSleepThoughts', e.target.value)}
                      placeholder="例如：工作上的一件事、某段對話…"
                      className="input-field"
                      style={{ fontSize: 13 }}
                    />
                  </div>

                  <div>
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
                    <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
                      {LIFE_THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMultiSelect('recentLifeThemes', opt)}
                          className={`pill-btn${(edited.recentLifeThemes ?? []).includes(opt) ? ' on' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input
                      value={(edited.recentLifeThemes ?? []).filter((t) => !LIFE_THEME_OPTIONS.includes(t)).join('、')}
                      onChange={(e) => {
                        const custom = e.target.value.split('、').map((s) => s.trim()).filter(Boolean);
                        const presets = (edited.recentLifeThemes ?? []).filter((t) => LIFE_THEME_OPTIONS.includes(t));
                        updateField('recentLifeThemes', [...presets, ...custom]);
                      }}
                      placeholder="其他主題（用「、」分隔）"
                      className="input-field"
                      style={{ fontSize: 12.5 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dream extra */}
            <div className="collapse">
              <button
                type="button"
                className="collapse-head"
                onClick={() => setShowDreamExtra(!showDreamExtra)}
              >
                <span>
                  {showDreamExtra ? '▾' : '▸'}{' '}
                  <span className="zh" style={{ fontSize: 11, letterSpacing: '0.08em', color: '#e0c7d6' }}>
                    補充
                  </span>{' '}
                  EXTRA
                </span>
                <span className="hint">{showDreamExtra ? '收 起' : '選 填 ▾'}</span>
              </button>
              {showDreamExtra && (
                <div className="collapse-body">
                  <div>
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
                      強調感官（可複選）
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SENSE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMultiSelect('senses', opt)}
                          className={`pill-btn${(edited.senses ?? []).includes(opt) ? ' on' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
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
                      夢的結尾狀態
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DREAM_ENDING_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField('dreamEnding', edited.dreamEnding === opt ? '' : opt)}
                          className={`pill-btn${edited.dreamEnding === opt ? ' on' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="zh" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>
                      是否為重複出現的夢
                    </span>
                    <button
                      type="button"
                      onClick={() => updateField('isRecurring', !edited.isRecurring)}
                      style={{
                        position: 'relative',
                        width: 44,
                        height: 24,
                        borderRadius: 100,
                        background: edited.isRecurring ? 'rgba(242,217,143,0.55)' : 'rgba(75,80,110,0.6)',
                        border: '1px solid var(--border-soft)',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: edited.isRecurring ? 22 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: edited.isRecurring ? 'var(--ink-on-moon)' : 'var(--ink-dim)',
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>

                  {edited.isRecurring && (
                    <div>
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
                        關聯到舊記錄
                      </div>
                      <input
                        value={edited.recurringDreamRef ?? ''}
                        onChange={(e) => updateField('recurringDreamRef', e.target.value)}
                        placeholder="例如：上次夢到類似場景是…"
                        className="input-field"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex gap-2.5"
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--hair)',
            background: 'rgba(6,6,15,0.5)',
          }}
        >
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="btn-secondary flex-1"
          >
            捨 棄 · DISCARD
          </button>
          <button
            type="button"
            onClick={() => onSave(edited, editedTranscript)}
            disabled={isSaving}
            className="btn-primary-sm flex-1"
          >
            {isSaving ? '封 存 中 ⋯' : '封 存 · ARCHIVE →'}
          </button>
        </div>
      </div>
    </div>
  );
}
