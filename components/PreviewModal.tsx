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

  const updateArrayField = (key: 'characters' | 'locations' | 'symbols' | 'tags' | 'recentLifeThemes', value: string) => {
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-h-[92vh] overflow-y-auto bg-gray-900 rounded-t-3xl border-t border-gray-700 p-5">
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5" />
        <h2 className="text-white text-xl font-semibold mb-1">確認夢境記錄</h2>
        <p className="text-gray-400 text-sm mb-5">AI 已分析完成，你可以修改後儲存</p>

        <div className="space-y-4">
          {/* Summary */}
          <Field label="摘要">
            <textarea
              value={edited.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              rows={2}
              className="input-field"
            />
          </Field>

          {/* Emotion */}
          <Field label="情緒">
            <input
              value={edited.emotion}
              onChange={(e) => updateField('emotion', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Lucidity */}
          <Field label="清醒度">
            <input
              value={edited.lucidity}
              onChange={(e) => updateField('lucidity', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Characters */}
          <Field label="人物（用「、」分隔）">
            <input
              value={edited.characters.join('、')}
              onChange={(e) => updateArrayField('characters', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Locations */}
          <Field label="地點（用「、」分隔）">
            <input
              value={edited.locations.join('、')}
              onChange={(e) => updateArrayField('locations', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Symbols */}
          <Field label="符號/意象（用「、」分隔）">
            <input
              value={edited.symbols.join('、')}
              onChange={(e) => updateArrayField('symbols', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Numbers */}
          {edited.numbers.length > 0 && (
            <Field label="出現的數字">
              <div className="space-y-2">
                {edited.numbers.map((n, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-3">
                    <span className="text-yellow-400 font-bold">{n.value}</span>
                    <span className="text-gray-400 text-sm ml-2">{n.context}</span>
                  </div>
                ))}
              </div>
            </Field>
          )}

          {/* Tags */}
          <Field label="標籤（用「、」分隔）">
            <input
              value={edited.tags.join('、')}
              onChange={(e) => updateArrayField('tags', e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Transcript toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-gray-400 text-sm underline"
          >
            {showTranscript ? '隱藏' : '查看/編輯'} 原始逐字稿
          </button>

          {showTranscript && (
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              rows={5}
              className="input-field text-sm"
            />
          )}

          {/* 入夢前狀態 */}
          <div className="border border-gray-700 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreSleep(!showPreSleep)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-gray-300 text-sm font-medium">🌙 入夢前狀態</span>
              <span className="text-xs text-gray-500">{showPreSleep ? '收起 ▲' : '選填，可跳過 ▼'}</span>
            </button>

            {showPreSleep && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-700/60">
                <div className="pt-3">
                  <Field label="睡前身體感受">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PRE_SLEEP_BODY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField('preSleepBody', edited.preSleepBody === opt ? '' : opt)}
                          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                            edited.preSleepBody === opt
                              ? 'border-yellow-400/60 text-yellow-300'
                              : 'border-gray-600 text-gray-400'
                          }`}
                          style={edited.preSleepBody === opt ? { background: 'rgba(247,247,87,0.12)' } : {}}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="睡前主要在想的事（選填）">
                  <input
                    value={edited.preSleepThoughts ?? ''}
                    onChange={(e) => updateField('preSleepThoughts', e.target.value)}
                    placeholder="例如：工作上的一件事、某段對話…"
                    className="input-field"
                  />
                </Field>

                <Field label="近期重複出現的生活主題">
                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    {LIFE_THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleMultiSelect('recentLifeThemes', opt)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          (edited.recentLifeThemes ?? []).includes(opt)
                            ? 'border-yellow-400/60 text-yellow-300'
                            : 'border-gray-600 text-gray-400'
                        }`}
                        style={(edited.recentLifeThemes ?? []).includes(opt) ? { background: 'rgba(247,247,87,0.12)' } : {}}
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
                    className="input-field text-sm"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* 夢境補充 */}
          <div className="border border-gray-700 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDreamExtra(!showDreamExtra)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-gray-300 text-sm font-medium">✨ 夢境補充</span>
              <span className="text-xs text-gray-500">{showDreamExtra ? '收起 ▲' : '選填 ▼'}</span>
            </button>

            {showDreamExtra && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-700/60">
                <div className="pt-3">
                  <Field label="夢中被強調的感官（可複選）">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SENSE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMultiSelect('senses', opt)}
                          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                            (edited.senses ?? []).includes(opt)
                              ? 'border-yellow-400/60 text-yellow-300'
                              : 'border-gray-600 text-gray-400'
                          }`}
                          style={(edited.senses ?? []).includes(opt) ? { background: 'rgba(247,247,87,0.12)' } : {}}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="夢的結尾狀態">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DREAM_ENDING_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('dreamEnding', edited.dreamEnding === opt ? '' : opt)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          edited.dreamEnding === opt
                            ? 'border-yellow-400/60 text-yellow-300'
                            : 'border-gray-600 text-gray-400'
                        }`}
                        style={edited.dreamEnding === opt ? { background: 'rgba(247,247,87,0.12)' } : {}}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-400 text-xs">是否為重複出現的夢</span>
                  <button
                    type="button"
                    onClick={() => updateField('isRecurring', !edited.isRecurring)}
                    className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    style={{ background: edited.isRecurring ? 'rgba(247,247,87,0.6)' : 'rgba(75,85,99,1)' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: edited.isRecurring ? '22px' : '2px' }}
                    />
                  </button>
                </div>

                {edited.isRecurring && (
                  <Field label="關聯到舊記錄（描述或備注）">
                    <input
                      value={edited.recurringDreamRef ?? ''}
                      onChange={(e) => updateField('recurringDreamRef', e.target.value)}
                      placeholder="例如：上次夢到類似場景是…"
                      className="input-field"
                    />
                  </Field>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pb-2">
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="flex-1 py-4 rounded-2xl border border-gray-600 text-gray-300 text-lg font-medium"
          >
            丟棄
          </button>
          <button
            onClick={() => onSave(edited, editedTranscript)}
            disabled={isSaving}
            className="flex-1 py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0a08' }}
          >
            {isSaving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs mb-1.5">{label}</label>
      {children}
    </div>
  );
}
