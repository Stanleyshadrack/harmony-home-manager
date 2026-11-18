import { useEffect, useState } from 'react';
import { fetchProtectedFile } from '@/api/service/mediaApi';

/** Convert an authenticated media response to a revocable object URL. */
export function useProtectedMedia(path?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!path) return;
    if (path.startsWith('blob:') || path.startsWith('data:image/')) {
      setUrl(path);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;
    void fetchProtectedFile(path)
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return url;
}
