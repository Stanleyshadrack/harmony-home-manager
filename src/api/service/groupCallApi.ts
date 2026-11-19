import { apiRequest } from '@/api/https';

export interface GroupCall {
  callId: string;
  conversationId: number;
  createdBy: number;
  video: boolean;
  status: 'ACTIVE' | 'ENDED';
  createdAt: string;
  joinedUserIds: number[];
  capacity: number;
}
export interface GroupSignal {
  sequence: number;
  senderId: number;
  targetUserId: number;
  kind: 'offer' | 'answer' | 'candidate';
  payload: string;
}
const root = (conversationId: number, callId: string) =>
  `/api/chat/conversations/${conversationId}/group-calls/${encodeURIComponent(callId)}`;
export const groupCallApi = {
  start: (conversationId: number, video: boolean) =>
    apiRequest<{video:boolean}, GroupCall>({
      path: `/api/chat/conversations/${conversationId}/group-calls`, method: 'POST', body: {video}
    }),
  current: (conversationId: number) => apiRequest<null, GroupCall | null>({
    path: `/api/chat/conversations/${conversationId}/group-calls/current`, method: 'GET'
  }),
  incoming: () => apiRequest<null, GroupCall[]>({
    path: '/api/chat/group-calls/incoming', method: 'GET'
  }),
  state: (conversationId: number, callId: string) => apiRequest<null, GroupCall>({
    path: root(conversationId, callId), method: 'GET'
  }),
  join: (conversationId: number, callId: string) => apiRequest<null, GroupCall>({
    path: `${root(conversationId, callId)}/join`, method: 'POST'
  }),
  leave: (conversationId: number, callId: string) => apiRequest<null, GroupCall>({
    path: `${root(conversationId, callId)}/leave`, method: 'POST'
  }),
  sendSignal: (conversationId: number, callId: string, targetUserId: number,
               kind: GroupSignal['kind'], payload: string) =>
    apiRequest<{targetUserId:number;kind:string;payload:string},void>({
      path: `${root(conversationId, callId)}/signals`, method: 'POST',
      body: {targetUserId, kind, payload}
    }),
  signals: (conversationId: number, callId: string, since: number) =>
    apiRequest<null, GroupSignal[]>({
      path: `${root(conversationId, callId)}/signals?since=${since}`, method: 'GET'
    })
};
