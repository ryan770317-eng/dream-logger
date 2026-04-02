'use client';

import { useState, useRef, useCallback } from 'react';

interface RecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export default function RecordButton({ onRecordingComplete, disabled }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      alert('無法取得麥克風權限，請確認設定');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        disabled={disabled}
        className={`
          w-40 h-40 rounded-full text-white text-xl font-semibold
          flex items-center justify-center select-none touch-none
          transition-all duration-150 shadow-2xl
          ${isRecording
            ? 'bg-red-500 scale-110 shadow-red-500/50 ring-4 ring-red-400 ring-offset-4 ring-offset-gray-900'
            : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isRecording ? (
          <span className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-sm bg-white animate-pulse" />
            <span className="text-sm">錄音中</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <span className="text-4xl">🎙️</span>
            <span className="text-sm">按住錄音</span>
          </span>
        )}
      </button>
      {isRecording && (
        <p className="text-red-400 text-sm animate-pulse">放開停止錄音</p>
      )}
    </div>
  );
}
