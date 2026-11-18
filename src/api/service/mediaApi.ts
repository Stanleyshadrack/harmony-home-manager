import { apiRequest } from '@/api/https';
import { tokenService } from '@/services/tokenService';

/** JWT-protected binary files must never use the publicly accessible /uploads URL. */
export async function fetchProtectedFile(path: string): Promise<Blob> {
  if (!/^\/api\/(chat\/conversations\/\d+\/attachments\/\d+|users\/\d+\/avatar)(\?.*)?$/.test(path)) {
    throw new Error('Invalid protected media URL');
  }

  const request = () => fetch(path, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenService.getAccessToken() || ''}` },
    cache: 'no-store',
  });

  let response = await request();
  if (response.status === 401 && tokenService.getAccessToken()) {
    // The standard API utility safely refreshes an expired JWT if possible.
    await apiRequest<null, unknown>({ path: '/api/auth/me', method: 'GET' });
    response = await request();
  }
  if (!response.ok) {
    throw new Error(response.status === 403
      ? 'You do not have permission to view this file.'
      : response.status === 404 ? 'File unavailable.' : 'Unable to load file.');
  }
  return response.blob();
}

export async function downloadProtectedFile(path: string, filename: string): Promise<void> {
  const blob = await fetchProtectedFile(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'attachment';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
