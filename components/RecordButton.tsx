'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RecordButtonProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    '',
  ];
  for (const type of types) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export default function RecordButton({ onRecordingComplete, disabled, compact }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} : ${String(s).padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setDuration(0);
        setIsRecording(false);
        onRecordingComplete(blob, elapsed);
      };

      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setDuration(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err) {
      console.error('Mic error:', err);
      alert('無法存取麥克風，請確認瀏覽器已授予麥克風權限');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const handleClick = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className={`mic-aura ${compact ? 'compact' : ''}`}>
        <span className="ring" />
        <span className="ring" />
        <span className="ring" />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label={isRecording ? 'stop' : 'record'}
          className={`mic-btn ${compact ? 'compact' : ''} ${isRecording ? 'recording' : ''}`}
        >
          <span className="rec-label">{isRecording ? 'STOP' : 'REC'}</span>
        </button>
      </div>

      {isRecording ? (
        <>
          <div
            className="mono"
            style={{
              fontWeight: 500,
              fontSize: compact ? 20 : 28,
              color: 'var(--ink)',
              letterSpacing: '0.1em',
            }}
          >
            {formatDuration(duration)}
          </div>
          <div className="rec-waveform" aria-hidden>
            <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--ink-dim)' }}>TAP</span> · 停 止 擷 取
          </div>
        </>
      ) : (
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'var(--ink-dim)' }}>TAP</span> · 開 始 擷 取
        </div>
      )}
    </div>
  );
}
