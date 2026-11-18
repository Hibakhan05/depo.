import api from './client';

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_BYTES = 2 * 1024 * 1024;

export function validateImage(file) {
  if (!ACCEPTED.includes(file.type)) return 'Use a JPG, PNG or WebP image';
  if (file.size > MAX_BYTES) return 'Image must be 2 MB or smaller';
  return null;
}

// Authenticated direct upload: the backend signs, the browser uploads to ImageKit.
export async function uploadImage(file, folder = 'depo') {
  const { data: auth } = await api.get('/upload/auth');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('fileName', file.name);
  fd.append('publicKey', auth.publicKey);
  fd.append('signature', auth.signature);
  fd.append('expire', auth.expire);
  fd.append('token', auth.token);
  fd.append('folder', `/${folder}`);
  fd.append('useUniqueFileName', 'true');
  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Image upload failed');
  return { url: json.url, fileId: json.fileId };
}
