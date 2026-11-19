import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  disabled?: boolean;
  onSend: (file: File, caption: string) => Promise<void>;
}
const LIMIT_MS = 120000;
const LIMIT_BYTES = 10 * 1024 * 1024;
const formats = [
  { mime: 'audio/webm;codecs=opus', ext: 'webm' },
  { mime: 'audio/webm', ext: 'webm' },
  { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
  { mime: 'audio/mp4', ext: 'm4a' },
];
export function VoiceNoteRecorder({ disabled, onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  const cancelled = useRef(false);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);

  const release = () => {
    if (timer.current != null) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  };
  const discard = () => {
    cancelled.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    release();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPreview(null);
    setFile(null);
    setRecording(false);
    setElapsed(0);
    chunks.current = [];
  };
  useEffect(() => () => {
    cancelled.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    release();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const start = async () => {
    if (disabled || recording || sending) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Voice notes need microphone permission and HTTPS (or localhost).');
      return;
    }
    const selected = formats.find(f => MediaRecorder.isTypeSupported(f.mime));
    if (!selected) { toast.error('This browser does not support voice-note recording.'); return; }
    try {
      discard();
      cancelled.current = false;
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const instance = new MediaRecorder(media, { mimeType: selected.mime });
      recorder.current = instance;
      chunks.current = [];
      instance.ondataavailable = event => {
        if (event.data.size) chunks.current.push(event.data);
      };
      instance.onstop = () => {
        release();
        setRecording(false);
        if (cancelled.current) return;
        const blob = new Blob(chunks.current, { type: selected.mime.split(';')[0] });
        chunks.current = [];
        if (!blob.size || blob.size > LIMIT_BYTES) {
          toast.error('Voice note must be smaller than 10 MB. Please record a shorter note.');
          return;
        }
        const note = new File([blob], `voice-note-${Date.now()}.${selected.ext}`, { type: blob.type });
        setFile(note);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setPreview(url);
      };
      instance.onerror = () => {
        toast.error('Recording failed. Please try again.');
        discard();
      };
      instance.start(250);
      startedAt.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timer.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(seconds);
        if (seconds >= LIMIT_MS / 1000 && recorder.current?.state === 'recording') recorder.current.stop();
      }, 500);
    } catch (error) {
      release();
      toast.error(error instanceof Error ? error.message : 'Unable to access microphone.');
    }
  };
  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };
  const send = async () => {
    if (!file || disabled || sending) return;
    setSending(true);
    try {
      await onSend(file, '🎤 Voice note');
      discard();
    } catch {
      // Keep the recorded note available to retry; parent displays the upload error.
    } finally { setSending(false); }
  };
  return <div className="flex min-w-0 items-center gap-2">
    {!recording && !preview && <Button type="button" variant="ghost" size="icon" disabled={disabled || sending}
      aria-label="Record voice note" title="Record voice note" onClick={() => void start()}>
      <Mic className="h-5 w-5" />
    </Button>}
    {recording && <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
      <span className="text-xs text-destructive" role="status">● Recording {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
      <Button type="button" size="sm" variant="outline" onClick={stop}><Square className="mr-1 h-3 w-3" /> Stop</Button>
      <Button type="button" size="icon" variant="ghost" onClick={discard} aria-label="Discard recording"><Trash2 className="h-4 w-4"/></Button>
    </div>}
    {preview && <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-lg border p-2">
      <audio src={preview} controls preload="metadata" className="h-9 w-[min(14rem,55vw)] max-w-full" aria-label="Voice note preview" />
      <Button type="button" size="icon" aria-label="Send voice note" disabled={disabled || sending} onClick={() => void send()}>
        <Send className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Discard voice note" disabled={sending} onClick={discard}>
        <Trash2 className="h-4 w-4"/>
      </Button>
    </div>}
  </div>;
}
