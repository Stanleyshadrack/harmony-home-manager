import { useEffect, useRef, useState } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { groupCallApi, type GroupCall, type GroupSignal } from '@/api/service/groupCallApi';
import type { Conversation } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  conversation: Conversation | null;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(process.env.NEXT_PUBLIC_TURN_URL && process.env.NEXT_PUBLIC_TURN_USERNAME
    && process.env.NEXT_PUBLIC_TURN_CREDENTIAL
    ? [{ urls: process.env.NEXT_PUBLIC_TURN_URL,
         username: process.env.NEXT_PUBLIC_TURN_USERNAME,
         credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL }]
    : []),
];

function RemoteParticipant({ stream, video, name }: {stream: MediaStream; video: boolean; name: string}) {
  const audio = useRef<HTMLAudioElement>(null);
  const picture = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (audio.current) audio.current.srcObject = stream;
    if (picture.current) picture.current.srcObject = stream;
    return () => {
      if (audio.current) audio.current.srcObject = null;
      if (picture.current) picture.current.srcObject = null;
    };
  }, [stream]);
  return <div className="min-w-0 overflow-hidden rounded-md border bg-muted/30 p-2">
    <audio ref={audio} autoPlay playsInline />
    {video && <video ref={picture} autoPlay playsInline muted
      className="aspect-video w-full rounded bg-slate-900 object-contain" />}
    <p className="mt-1 truncate text-sm">{name}</p>
  </div>;
}

export function GroupCallControls({ conversation, conversations, onSelectConversation }: Props) {
  const { user } = useAuth();
  const self = Number(user?.id);
  const [incoming, setIncoming] = useState<GroupCall | null>(null);
  const [active, setActive] = useState<GroupCall | null>(null);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
  const [phase, setPhase] = useState('Connecting…');
  const peers = useRef<Map<number, RTCPeerConnection>>(new Map());
  const pendingIce = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
  const offered = useRef<Set<number>>(new Set());
  const local = useRef<MediaStream | null>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<GroupCall | null>(null);
  const seq = useRef(0);
  const syncing = useRef(false);
  const dismissed = useRef<Set<string>>(new Set());

  const reset = () => {
    peers.current.forEach(pc => pc.close());
    peers.current.clear();
    offered.current.clear();
    pendingIce.current.clear();
    local.current?.getTracks().forEach(track => track.stop());
    local.current = null;
    seq.current = 0;
    activeRef.current = null;
    setActive(null);
    setMuted(false);
    setCameraOff(false);
    setRemoteStreams({});
  };
  useEffect(() => () => {
    peers.current.forEach(pc => pc.close());
    local.current?.getTracks().forEach(track => track.stop());
    const room = activeRef.current;
    if (room) void groupCallApi.leave(room.conversationId, room.callId).catch(() => {});
  }, []);

  useEffect(() => {
    if (preview.current) preview.current.srcObject = local.current;
  }, [active?.callId, phase]);

  const acquire = async (video: boolean) => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error('Group calling requires HTTPS or localhost microphone/camera permission.');
    const stream = await navigator.mediaDevices.getUserMedia({audio:true, video});
    local.current = stream;
    if (preview.current) preview.current.srcObject = stream;
  };
  const closePeer = (id: number) => {
    peers.current.get(id)?.close();
    peers.current.delete(id);
    pendingIce.current.delete(id);
    offered.current.delete(id);
    setRemoteStreams(prev => {
      const next = {...prev}; delete next[id]; return next;
    });
  };
  const getPeer = (room: GroupCall, remoteId: number) => {
    const existing = peers.current.get(remoteId);
    if (existing) return existing;
    if (!local.current) throw new Error('Microphone was not initialized');
    const pc = new RTCPeerConnection({iceServers});
    peers.current.set(remoteId, pc);
    local.current.getTracks().forEach(track => pc.addTrack(track, local.current!));
    pc.onicecandidate = event => {
      if (event.candidate) void groupCallApi.sendSignal(room.conversationId, room.callId,
        remoteId, 'candidate', JSON.stringify(event.candidate.toJSON()))
        .catch(() => toast.error('Unable to exchange group network details'));
    };
    pc.ontrack = event => {
      setRemoteStreams(prev => {
        const stream = prev[remoteId] ?? new MediaStream();
        if (!stream.getTracks().some(t => t.id === event.track.id)) stream.addTrack(event.track);
        return {...prev, [remoteId]:stream};
      });
      setPhase('Connected');
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setPhase('Peer connection failed — TURN relay may be needed');
      }
    };
    return pc;
  };
  const flushIce = async (id:number, pc:RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const queued = pendingIce.current.get(id) ?? [];
    pendingIce.current.delete(id);
    for (const candidate of queued) await pc.addIceCandidate(candidate);
  };
  const signal = async (room:GroupCall, event:GroupSignal) => {
    if (!room.joinedUserIds.includes(event.senderId) || event.senderId === self) return;
    const pc = getPeer(room, event.senderId);
    if (event.kind === 'offer') {
      if (pc.signalingState !== 'stable') return;
      await pc.setRemoteDescription(JSON.parse(event.payload) as RTCSessionDescriptionInit);
      await flushIce(event.senderId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await groupCallApi.sendSignal(room.conversationId, room.callId,
        event.senderId, 'answer', JSON.stringify(answer));
    } else if (event.kind === 'answer') {
      if (pc.signalingState !== 'have-local-offer') return;
      await pc.setRemoteDescription(JSON.parse(event.payload) as RTCSessionDescriptionInit);
      await flushIce(event.senderId, pc);
    } else {
      const candidate = JSON.parse(event.payload) as RTCIceCandidateInit;
      if (pc.remoteDescription) await pc.addIceCandidate(candidate);
      else pendingIce.current.set(event.senderId,
        [...(pendingIce.current.get(event.senderId) ?? []), candidate]);
    }
  };
  const connect = async (room: GroupCall) => {
    const other = room.joinedUserIds.filter(id => id !== self);
    for (const id of [...peers.current.keys()]) if (!other.includes(id)) closePeer(id);
    for (const id of other) {
      // Smaller user ID is the deterministic offerer, avoiding negotiation glare.
      if (self >= id || offered.current.has(id)) continue;
      offered.current.add(id);
      try {
        const pc = getPeer(room, id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await groupCallApi.sendSignal(room.conversationId, room.callId, id, 'offer', JSON.stringify(offer));
      } catch (error) {
        offered.current.delete(id);
        closePeer(id);
        throw error;
      }
    }
  };
  const activate = (room: GroupCall) => {
    seq.current = 0;
    activeRef.current = room;
    setActive(room);
    setIncoming(null);
    setPhase('Connecting…');
    const match = conversations.find(c => c.id === room.conversationId);
    if (match) onSelectConversation(match);
  };
  const start = async (video:boolean) => {
    if (!conversation || conversation.type !== 'GROUP' || busy || activeRef.current) return;
    setBusy(true);
    try {
      await acquire(video);
      const room = await groupCallApi.start(conversation.id, video);
      activate(room);
    } catch (error) {
      reset();
      toast.error(error instanceof Error ? error.message : 'Cannot start group call');
    } finally {setBusy(false);}
  };
  const join = async () => {
    const room = incoming;
    if (!room || busy || activeRef.current) return;
    setBusy(true);
    try {
      await acquire(room.video);
      const joined = await groupCallApi.join(room.conversationId, room.callId);
      activate(joined);
      await connect(joined);
    } catch (error) {
      reset();
      toast.error(error instanceof Error ? error.message : 'Could not join group call');
    } finally {setBusy(false);}
  };
  const leave = async () => {
    const room = activeRef.current;
    reset();
    setIncoming(null);
    if (room) {
      try {await groupCallApi.leave(room.conversationId, room.callId);}
      catch {toast.error('Unable to notify others that you left');}
    }
  };
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const poll = async () => {
      if (activeRef.current) return;
      try {
        const calls = await groupCallApi.incoming();
        if (!cancelled) setIncoming(calls.find(call => !dismissed.current.has(call.callId)) ?? null);
      } catch { /* retry while authenticated */ }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 2500);
    return () => {cancelled = true; window.clearInterval(timer);};
  }, [user?.id]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const sync = async () => {
      if (syncing.current || cancelled) return;
      syncing.current = true;
      try {
        const room = await groupCallApi.state(active.conversationId, active.callId);
        if (cancelled || activeRef.current?.callId !== room.callId) return;
        if (!room.joinedUserIds.includes(self)) { reset(); return; }
        activeRef.current = room;
        setActive(room);
        const events = await groupCallApi.signals(room.conversationId, room.callId, seq.current);
        for (const event of events) {
          if (cancelled) break;
          await signal(room, event);
          seq.current = Math.max(seq.current, event.sequence);
        }
        await connect(room);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Call disconnected';
          if (message.includes('no longer active')) {
            reset();
            toast.info('The group call has ended');
          } else setPhase(message);
        }
      } finally {syncing.current = false;}
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 1100);
    return () => {cancelled = true; window.clearInterval(timer);};
  }, [active?.callId, self]);

  const memberName = (id:number) => {
    const match = conversations.find(c => c.id === active?.conversationId);
    return match?.members.find(m => m.userId === id)?.name || `Member ${id}`;
  };

  return <>
    {conversation?.type === 'GROUP' && <div className="flex flex-wrap items-center gap-1">
      <Button type="button" variant="outline" size="icon" title="Start group voice call"
        aria-label="Start group voice call" disabled={busy || !!active || !!incoming}
        onClick={() => void start(false)}><UsersRound className="h-4 w-4"/></Button>
      <Button type="button" variant="outline" size="icon" title="Start group video call"
        aria-label="Start group video call" disabled={busy || !!active || !!incoming}
        onClick={() => void start(true)}><Video className="h-4 w-4"/></Button>
    </div>}
    <Dialog open={!!incoming && !active} onOpenChange={() => {}}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
        <DialogHeader><DialogTitle>Group {incoming?.video ? 'video' : 'voice'} call</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          A group call is active. Join to speak with the participants (up to four).
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button disabled={busy || (incoming?.joinedUserIds.length ?? 0) >= 4}
            onClick={() => void join()}><Phone className="mr-2 h-4 w-4"/>Join call</Button>
          <Button variant="outline" disabled={busy} onClick={() => { if (incoming) dismissed.current.add(incoming.callId); setIncoming(null); }}>Not now</Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!active} onOpenChange={() => {}}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-3 overflow-y-auto">
        <DialogHeader><DialogTitle>Group {active?.video ? 'video' : 'voice'} call</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground" role="status">
          {phase} · {active?.joinedUserIds.length ?? 0}/{active?.capacity ?? 4} participants
        </p>
        {active?.video && <div className="overflow-hidden rounded-md bg-slate-900 p-2">
          <video ref={preview} autoPlay muted playsInline
            className="aspect-video max-h-52 w-full rounded object-contain"/>
          <p className="text-xs text-white">You</p>
        </div>}
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(remoteStreams).map(([id,stream]) =>
            <RemoteParticipant key={id} stream={stream} video={!!active?.video}
              name={memberName(Number(id))}/>)}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={() => {
              local.current?.getAudioTracks().forEach(t => {t.enabled = muted;});
              setMuted(!muted);
            }}>{muted ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}</Button>
          {active?.video && <Button variant="outline" aria-label={cameraOff ? 'Enable camera' : 'Disable camera'}
            onClick={() => {
              local.current?.getVideoTracks().forEach(t => {t.enabled = cameraOff;});
              setCameraOff(!cameraOff);
            }}>{cameraOff ? <VideoOff className="h-4 w-4"/> : <Video className="h-4 w-4"/>}</Button>}
          <Button variant="destructive" onClick={() => void leave()}>
            <PhoneOff className="mr-2 h-4 w-4"/>Leave call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
