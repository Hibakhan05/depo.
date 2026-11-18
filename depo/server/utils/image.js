import imagekit from '../config/imagekit.js';
import { HttpError } from './httpError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export const deleteImage = (fileId) => (fileId ? imagekit.deleteFile(fileId).catch(() => {}) : Promise.resolve());

// Confirms the file really exists in OUR ImageKit account, with an allowed type and size.
export async function verifyImage(url, fileId) {
  if (!url || !fileId) throw new HttpError(400, 'Image upload is incomplete');
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, '');
  if (!url.startsWith(`${endpoint}/`)) throw new HttpError(400, 'Images must be uploaded through ImageKit');
  let details;
  try {
    details = await imagekit.getFileDetails(fileId);
  } catch {
    throw new HttpError(400, 'Uploaded image could not be verified');
  }
  const sameFile = String(details.url).split('?')[0] === url.split('?')[0];
  if (!sameFile) throw new HttpError(400, 'Image URL does not match the uploaded file');
  if (!ALLOWED.includes(details.mime)) {
    await deleteImage(fileId);
    throw new HttpError(400, 'Only JPG, PNG and WebP images are allowed');
  }
  if (details.size > MAX_BYTES) {
    await deleteImage(fileId);
    throw new HttpError(400, 'Image must be 2 MB or smaller');
  }
}

// Sets url and fileId on a document when a NEW upload is supplied, and removes the old file.
export async function applyImage(doc, { urlField, idField }, url, fileId) {
  if (!fileId || fileId === doc[idField]) return;
  await verifyImage(url, fileId);
  await deleteImage(doc[idField]);
  doc[urlField] = url;
  doc[idField] = fileId;
}
