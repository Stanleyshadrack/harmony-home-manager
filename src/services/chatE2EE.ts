import { chatApi } from '@/api/service/chatApi';
import type { Message } from '@/types/message';

// E2EE v1: Web Crypto P-256 ECDH + HKDF-SHA256 + AES-256-GCM.
// Per-message random content keys are wrapped independently for every member.
// This is NOT Signal's Double Ratchet, has no key backup or multi-device support,
// and is not a substitute for an independently audited secure messenger.
const DB_NAME = 'propmanager-e2ee-v1';
const STORE = 'identities';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EncryptedPayload {
  ciphertext: string;
  cipherIv: string;
  ephemeralPublicKey: string;
  recipientKeys: Array<{ userId: number; wrappedKey: string; wrapIv: string }>;
  forwarded: boolean;
}
export interface PublicRecipient { userId: number; publicKey: string | null }
export interface EncryptedContent {
  text: string;
  attachment?: { filename: string; contentType: string; fileIv: string };
}
type Identity = { userId: number; publicKey: string; privateKey: CryptoKey };

export function encryptionSupported(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext &&
    !!window.crypto?.subtle && typeof indexedDB !== 'undefined';
}

function assertSecureContext() {
  if (!encryptionSupported())
    throw new Error('End-to-end encryption requires a trusted HTTPS address (or localhost), Web Crypto and IndexedDB. Plain HTTP on your phone is not supported.');
}

function bytesToB64(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let chars = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    chars += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(chars);
}
function b64ToBytes(value: string): Uint8Array {
  const raw = atob(value);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function randomIv(): Uint8Array { return crypto.getRandomValues(new Uint8Array(12)); }
function asBuf(value: Uint8Array): BufferSource { return value as BufferSource; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Cannot access secure browser key storage'));
  });
}
async function localIdentity(userId: number): Promise<Identity | null> {
  const db = await openDb();
  try {
    return await new Promise<Identity | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Cannot read local encryption key'));
    });
  } finally {
    db.close();
  }
}
async function saveIdentity(key: Identity): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Cannot store non-extractable encryption key'));
    });
  } finally {
    db.close();
  }
}
function publicCoordinates(key: string): string {
  const jwk = JSON.parse(key) as JsonWebKey;
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y || jwk.d)
    throw new Error('Unsupported encryption public key');
  return jwk.x + ':' + jwk.y;
}

export async function ensureChatIdentity(userId: number): Promise<void> {
  assertSecureContext();
  const registered = await chatApi.identity();
  const local = await localIdentity(userId);
  if (registered) {
    if (!local || publicCoordinates(local.publicKey) !== publicCoordinates(registered.publicKey))
      throw new Error('Your private encryption key is on another browser/device. This device cannot decrypt or send messages. Do not reset your browser storage.');
    return;
  }
  if (local) {
    await chatApi.registerIdentity(local.publicKey);
    return;
  }
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const publicKey = JSON.stringify({ kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y });
  // A non-extractable private key stays in IndexedDB, never on the server.
  await saveIdentity({ userId, publicKey, privateKey: pair.privateKey });
  await chatApi.registerIdentity(publicKey);
}

async function importPublic(key: string): Promise<CryptoKey> {
  publicCoordinates(key);
  return crypto.subtle.importKey('jwk', JSON.parse(key) as JsonWebKey,
    { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}
async function deriveWrappingKey(privateKey: CryptoKey, publicKey: CryptoKey,
  conversationId: number, userId: number): Promise<CryptoKey> {
  const secret = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const hkdf = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({
    name: 'HKDF', hash: 'SHA-256',
    salt: encoder.encode('propmanager-e2ee-v1'),
    info: encoder.encode(`wrap:${conversationId}:${userId}`),
  }, hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function unwrapContentKey(conversationId: number, userId: number,
  message: Message): Promise<CryptoKey> {
  assertSecureContext();
  const identity = await localIdentity(userId);
  if (!identity) throw new Error('Private key unavailable on this device');
  const meta = message.crypto;
  if (!meta) throw new Error('Encrypted message is missing its recipient envelope');
  const ephemeral = await importPublic(meta.ephemeralPublicKey);
  const wrap = await deriveWrappingKey(identity.privateKey, ephemeral, conversationId, userId);
  const raw = await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: asBuf(b64ToBytes(meta.wrapIv)),
    additionalData: encoder.encode(`key:${conversationId}:${userId}`),
  }, wrap, asBuf(b64ToBytes(meta.wrappedKey)));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function decryptChatMessage(conversationId: number, userId: number,
  message: Message): Promise<{text: string; attachment?: EncryptedContent['attachment']}> {
  if (!message.encrypted || message.deleted) return { text: message.content };
  const key = await unwrapContentKey(conversationId, userId, message);
  const meta = message.crypto!;
  const plaintext = await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: asBuf(b64ToBytes(meta.cipherIv)),
    additionalData: encoder.encode(`msg:${conversationId}`),
  }, key, asBuf(b64ToBytes(message.content)));
  const result = JSON.parse(decoder.decode(plaintext)) as EncryptedContent;
  if (typeof result.text !== 'string' || result.text.length > 4000) throw new Error('Invalid encrypted payload');
  return { text: result.text, attachment: result.attachment };
}

export async function decryptChatFile(conversationId: number, userId: number,
  message: Message, ciphertext: Blob): Promise<Blob> {
  if (!message.encrypted || !message.decryptedAttachment)
    throw new Error('Encrypted attachment metadata is unavailable');
  const key = await unwrapContentKey(conversationId, userId, message);
  const bytes = await ciphertext.arrayBuffer();
  const plaintext = await crypto.subtle.decrypt({
    name: 'AES-GCM',
    iv: asBuf(b64ToBytes(message.decryptedAttachment.fileIv)),
    additionalData: encoder.encode(`file:${conversationId}`),
  }, key, bytes);
  return new Blob([plaintext], { type: message.decryptedAttachment.contentType });
}

export async function encryptChatMessage(conversationId: number, userId: number,
  recipients: PublicRecipient[], text: string, file?: File, forwarded = false):
  Promise<{payload: EncryptedPayload; encryptedFile?: File}> {
  assertSecureContext();
  await ensureChatIdentity(userId);
  if (!recipients.length || recipients.some(r => !r.publicKey))
    throw new Error('Every participant must initialize secure messaging before you can send encrypted messages.');
  const identity = await localIdentity(userId);
  if (!identity) throw new Error('Encryption private key unavailable');

  const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true,
    ['encrypt', 'decrypt']);
  const raw = await crypto.subtle.exportKey('raw', contentKey);
  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false,
    ['deriveBits']);
  const ephJwk = await crypto.subtle.exportKey('jwk', ephemeral.publicKey);
  const ephemeralPublicKey = JSON.stringify({ kty: 'EC', crv: 'P-256', x: ephJwk.x, y: ephJwk.y });

  const wraps: EncryptedPayload['recipientKeys'] = [];
  const unique = new Set<number>();
  for (const recipient of recipients) {
    if (unique.has(recipient.userId)) throw new Error('Duplicate encryption recipient');
    unique.add(recipient.userId);
    const publicKey = recipient.publicKey!;
    // Trust on first use: detect unexpected key changes. No out-of-band
    // verification or independent key transparency is provided in v1.
    const pinName = `propmanager:e2ee:pin:${userId}:${recipient.userId}`;
    const fingerprint = publicCoordinates(publicKey);
    const pinned = localStorage.getItem(pinName);
    if (pinned && pinned !== fingerprint)
      throw new Error('A participant encryption key changed. Message blocked for your protection.');
    if (!pinned) localStorage.setItem(pinName, fingerprint);

    const wrapKey = await deriveWrappingKey(ephemeral.privateKey,
      await importPublic(publicKey), conversationId, recipient.userId);
    const wrapIv = randomIv();
    const ciphertext = await crypto.subtle.encrypt({
      name: 'AES-GCM', iv: asBuf(wrapIv),
      additionalData: encoder.encode(`key:${conversationId}:${recipient.userId}`),
    }, wrapKey, raw);
    wraps.push({ userId: recipient.userId,
      wrappedKey: bytesToB64(ciphertext), wrapIv: bytesToB64(wrapIv) });
  }
  if (!unique.has(userId)) throw new Error('Sender must be included in the encryption key recipients');

  let encryptedFile: File | undefined;
  let attachment: EncryptedContent['attachment'];
  if (file) {
    const fileIv = randomIv();
    const original = await file.arrayBuffer();
    const ciphertext = await crypto.subtle.encrypt({
      name: 'AES-GCM', iv: asBuf(fileIv),
      additionalData: encoder.encode(`file:${conversationId}`),
    }, contentKey, original);
    encryptedFile = new File([ciphertext], 'encrypted.bin',
      { type: 'application/octet-stream' });
    attachment = { filename: file.name, contentType: file.type || 'application/octet-stream',
      fileIv: bytesToB64(fileIv) };
  }

  const plaintext = encoder.encode(JSON.stringify({ text, attachment }));
  const iv = randomIv();
  const ciphertext = await crypto.subtle.encrypt({
    name: 'AES-GCM', iv: asBuf(iv),
    additionalData: encoder.encode(`msg:${conversationId}`),
  }, contentKey, plaintext);
  return {
    payload: {
      ciphertext: bytesToB64(ciphertext), cipherIv: bytesToB64(iv),
      ephemeralPublicKey, recipientKeys: wraps, forwarded,
    },
    encryptedFile,
  };
}
