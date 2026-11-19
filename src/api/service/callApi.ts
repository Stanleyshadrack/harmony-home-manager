import { apiRequest } from '@/api/https';

export interface ChatCall {
  callId: string;
  conversationId: number;
  callerId: number;
  recipientId: number;
  video: boolean;
  status: 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'ENDED' | 'MISSED' | 'CANCELLED';
  createdAt: string;
}
export interface CallHistoryEntry {
  callId: string;
  conversationId: number;
  callerId: number;
  recipientId: number;
  video: boolean;
  status: 'RINGING' | 'ACCEPTED' | 'DECLINED' | 'ENDED' | 'MISSED' | 'CANCELLED';
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
}
export interface SignalEvent {
  sequence: number;
  senderId: number;
  kind: 'offer' | 'answer' | 'candidate';
  payload: string;
}
const root = (id: number, callId: string) =>
  `/api/chat/conversations/${id}/calls/${encodeURIComponent(callId)}`;

export const callApi = {
  history: () => apiRequest<null, CallHistoryEntry[]>({
    path: '/api/chat/calls/history', method: 'GET',
  }),
  start: (id: number, video: boolean) =>
    apiRequest<{ video: boolean }, ChatCall>({
      path: `/api/chat/conversations/${id}/calls`, method: 'POST', body: { video },
    }),
  incoming: () => apiRequest<null, ChatCall[]>({
    path: '/api/chat/calls/incoming', method: 'GET',
  }),
  state: (id: number, callId: string) => apiRequest<null, ChatCall>({
    path: root(id, callId), method: 'GET',
  }),
  accept: (id: number, callId: string) => apiRequest<null, ChatCall>({
    path: `${root(id, callId)}/accept`, method: 'POST',
  }),
  decline: (id: number, callId: string) => apiRequest<null, ChatCall>({
    path: `${root(id, callId)}/decline`, method: 'POST',
  }),
  end: (id: number, callId: string) => apiRequest<null, ChatCall>({
    path: `${root(id, callId)}/end`, method: 'POST',
  }),
  sendSignal: (id: number, callId: string, kind: SignalEvent['kind'], payload: string) =>
    apiRequest<{ kind: string; payload: string }, void>({
      path: `${root(id, callId)}/signals`, method: 'POST', body: { kind, payload },
    }),
  signals: (id: number, callId: string, since: number) =>
    apiRequest<null, SignalEvent[]>({
      path: `${root(id, callId)}/signals?since=${since}`, method: 'GET',
    }),
};
