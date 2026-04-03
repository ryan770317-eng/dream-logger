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

export default function PreviewModal({
  transcript,
  analysis,
  onSave,
  onDiscard,
  isSaving,
}: PreviewModalProps) {
  const [edited, setEdited] = useState<DreamAnalysis>(analysis);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [showTranscript, setShowTranscript] = useState(false);

  const updateField = <K extends keyof DreamAnalysis>(key: K, value: DreamAnalysis[K]) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayField = (key: 'characters' | 'locations' | 'symbols' | 'tags', value: string) => {
    updateField(key, value.split('、').map((s) => s.trim()).filter(Boolean));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-t-3xl border-t border-gray-700 p-5">
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
