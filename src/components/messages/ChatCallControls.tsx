import { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { callApi, type ChatCall, type SignalEvent } from '@/api/service/callApi';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation } from '@/types/message';
import { toast } from 'sonner';

interface Props {
  conversation: Conversation | null;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}
const rtcConfig: RTCConfiguration = {
  // STUN is suitable for basic tests. Production must have TURN credentials
  // provisioned securely, ideally via short-lived authenticated server tokens.
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    ...(process.env.NEXT_PUBLIC_TURN_URL && process.env.NEXT_PUBLIC_TURN_USERNAME &&
      process.env.NEXT_PUBLIC_TURN_CREDENTIAL
      ? [{ urls: process.env.NEXT_PUBLIC_TURN_URL,
           username: process.env.NEXT_PUBLIC_TURN_USERNAME,
           credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL }]
      : []),
  ],
};
export function ChatCallControls({ conversation, conversations, onSelectConversation }: Props) {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ChatCall | null>(null);
  const [active, setActive] = useState<ChatCall | null>(null);
  const [phase, setPhase] = useState('Connecting…');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [busy, setBusy] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const lastSignal = useRef(0);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const polling = useRef(false);
  const activeRef = useRef<ChatCall | null>(null);

  const resetMedia = useCallback(() => {
    pc.current?.close();
    pc.current = null;
    localStream.current?.getTracks().forEach(track => track.stop());
    localStream.current = null;
    remoteStream.current = null;
    pendingCandidates.current = [];
    lastSignal.current = 0;
    setMuted(false);
    setCameraOff(false);
    setActive(null);
    activeRef.current = null;
  }, []);

  useEffect(() => () => {
    // Stop local devices and peer connection if the Messages page unmounts.
    pc.current?.close();
    localStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (localVideo.current && localStream.current) localVideo.current.srcObject = localStream.current;
    if (remoteVideo.current && remoteStream.current) remoteVideo.current.srcObject = remoteStream.current;
    if (remoteAudio.current && remoteStream.current) remoteAudio.current.srcObject = remoteStream.current;
  }, [active?.callId, phase]);

  const peer = async (call: ChatCall, caller: boolean) => {
    if (pc.current) return pc.current;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error('Microphone and camera access requires HTTPS or localhost.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.video });
    localStream.current = stream;
    const connection = new RTCPeerConnection(rtcConfig);
    pc.current = connection;
    stream.getTracks().forEach(track => connection.addTrack(track, stream));
    connection.onicecandidate = event => {
      if (event.candidate) {
        void callApi.sendSignal(call.conversationId, call.callId,
          'candidate', JSON.stringify(event.candidate.toJSON()))
          .catch(() => toast.error('Unable to send network connection details.'));
      }
    };
    connection.ontrack = event => {
      const remote = remoteStream.current ?? new MediaStream();
      remoteStream.current = remote;
      if (!remote.getTracks().some(track => track.id === event.track.id))
        remote.addTrack(event.track);
      if (remoteAudio.current) remoteAudio.current.srcObject = remote;
      if (remoteVideo.current) remoteVideo.current.srcObject = remote;
      setPhase('Connected');
    };
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') setPhase('Connected');
      if (connection.connectionState === 'failed') {
        setPhase('Connection failed — check network or TURN relay');
        toast.error('Call network connection failed. A TURN server may be required.');
      }
    };
    if (localVideo.current) localVideo.current.srcObject = stream;
    if (caller) {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await callApi.sendSignal(call.conversationId, call.callId, 'offer', JSON.stringify(offer));
    }
    return connection;
  };

  const end = async () => {
    const call = activeRef.current;
    resetMedia();
    setIncoming(null);
    setPhase('Ended');
    if (call) {
      try { await callApi.end(call.conversationId, call.callId); }
      catch { /* peer can still close locally */ }
    }
  };
  const start = async (video: boolean) => {
    if (!conversation || busy || activeRef.current || incoming || conversation.type !== 'DIRECT') return;
    setBusy(true);
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error('Calls require HTTPS or localhost for microphone/camera permission.');
      const call = await callApi.start(conversation.id, video);
      activeRef.current = call;
      setActive(call);
      setPhase('Ringing…');
      try { await peer(call, true); }
      catch (error) {
        await callApi.end(call.conversationId, call.callId).catch(() => {});
        resetMedia();
        throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start call');
    } finally { setBusy(false); }
  };

  const accept = async () => {
    if (!incoming || busy) return;
    setBusy(true);
    const call = incoming;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error('Calls require HTTPS or localhost for microphone/camera permission.');
      // Request permission before accepting, so denial does not create a ghost call.
      await peer(call, false);
      const accepted = await callApi.accept(call.conversationId, call.callId);
      activeRef.current = accepted;
      setActive(accepted);
      setIncoming(null);
      setPhase('Connecting…');
      const matching = conversations.find(c => c.id === call.conversationId);
      if (matching) onSelectConversation(matching);
    } catch (error) {
      resetMedia();
      toast.error(error instanceof Error ? error.message : 'Unable to accept call');
    } finally { setBusy(false); }
  };

  const decline = async () => {
    if (!incoming) return;
    const call = incoming;
    setIncoming(null);
    try { await callApi.decline(call.conversationId, call.callId); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to decline call'); }
  };

  const handleSignal = async (call: ChatCall, signal: SignalEvent) => {
    const connection = pc.current;
    if (!connection) return;
    if (signal.kind === 'offer') {
      if (call.recipientId !== Number(user?.id) || connection.remoteDescription) return;
      await connection.setRemoteDescription(JSON.parse(signal.payload) as RTCSessionDescriptionInit);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      await callApi.sendSignal(call.conversationId, call.callId, 'answer', JSON.stringify(answer));
    } else if (signal.kind === 'answer') {
      if (call.callerId !== Number(user?.id) || connection.remoteDescription) return;
      await connection.setRemoteDescription(JSON.parse(signal.payload) as RTCSessionDescriptionInit);
    } else if (signal.kind === 'candidate') {
      const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;
      if (connection.remoteDescription) await connection.addIceCandidate(candidate);
      else pendingCandidates.current.push(candidate);
    }
    if (connection.remoteDescription && pendingCandidates.current.length) {
      const waiting = pendingCandidates.current.splice(0);
      for (const candidate of waiting) await connection.addIceCandidate(candidate);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const checkIncoming = async () => {
      if (activeRef.current) return;
      try {
        const calls = await callApi.incoming();
        setIncoming(calls.find(c => c.recipientId === Number(user.id)) ?? null);
      } catch { /* passive polling; avoid noise during refresh */ }
    };
    void checkIncoming();
    const timer = window.setInterval(() => void checkIncoming(), 2000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    const sync = async () => {
      if (polling.current || disposed) return;
      polling.current = true;
      try {
        const status = await callApi.state(active.conversationId, active.callId);
        if (disposed) return;
        if (status.status === 'ENDED' || status.status === 'DECLINED') {
          resetMedia();
          toast.info(status.status === 'DECLINED' ? 'Call declined' : 'Call ended');
          return;
        }
        if (status.status === 'ACCEPTED' && phase === 'Ringing…') setPhase('Connecting…');
        const signals = await callApi.signals(active.conversationId, active.callId, lastSignal.current);
        for (const signal of signals) {
          if (disposed) break;
          await handleSignal(active, signal);
          lastSignal.current = Math.max(lastSignal.current, signal.sequence);
        }
      } catch (error) {
        if (!disposed) setPhase(error instanceof Error ? error.message : 'Call signaling unavailable');
      } finally { polling.current = false; }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 900);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [active?.callId, user?.id]);

  const toggleMute = () => {
    const tracks = localStream.current?.getAudioTracks() ?? [];
    tracks.forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };
  const toggleCamera = () => {
    const tracks = localStream.current?.getVideoTracks() ?? [];
    tracks.forEach(t => { t.enabled = cameraOff; });
    setCameraOff(!cameraOff);
  };

  return <>
    {conversation?.type === 'DIRECT' && <div className="flex shrink-0 items-center gap-1">
      <Button type="button" size="icon" variant="outline" aria-label="Start voice call"
        title="Voice call" disabled={busy || !!active || !!incoming}
        onClick={() => void start(false)}><Phone className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="outline" aria-label="Start video call"
        title="Video call" disabled={busy || !!active || !!incoming}
        onClick={() => void start(true)}><Video className="h-4 w-4" /></Button>
    </div>}
    <Dialog open={!!incoming && !active} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Incoming {incoming?.video ? 'video' : 'voice'} call</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">A participant in your conversation is calling.</p>
        <div className="flex justify-center gap-3">
          <Button disabled={busy} onClick={() => void accept()}><Phone className="mr-2 h-4 w-4"/>Answer</Button>
          <Button disabled={busy} variant="destructive" onClick={() => void decline()}><PhoneOff className="mr-2 h-4 w-4"/>Decline</Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!active} onOpenChange={() => {}}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden">
        <DialogHeader><DialogTitle>{active?.video ? 'Video call' : 'Voice call'}</DialogTitle></DialogHeader>
        <p role="status" className="text-sm text-muted-foreground">{phase}</p>
        <audio ref={remoteAudio} autoPlay playsInline className="hidden" />
        {active?.video && <div className="relative min-h-40 overflow-hidden rounded-lg bg-slate-900">
          <video ref={remoteVideo} autoPlay muted playsInline className="h-56 w-full object-contain" />
          <video ref={localVideo} autoPlay muted playsInline
            className="absolute bottom-2 right-2 h-24 w-24 rounded-lg border object-cover" />
        </div>}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" disabled={!localStream.current} aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}>{muted ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}</Button>
          {active?.video && <Button variant="outline" disabled={!localStream.current}
            aria-label={cameraOff ? 'Enable camera' : 'Disable camera'} onClick={toggleCamera}>
            {cameraOff ? <VideoOff className="h-4 w-4"/> : <Video className="h-4 w-4"/>}
          </Button>}
          <Button variant="destructive" onClick={() => void end()}><PhoneOff className="mr-2 h-4 w-4"/>End call</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
