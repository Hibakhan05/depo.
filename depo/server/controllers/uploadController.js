import imagekit from '../config/imagekit.js';
import { asyncHandler } from '../utils/httpError.js';

// Short lived signature so React can upload straight to ImageKit. The private key never leaves the server.
export const getUploadAuth = asyncHandler(async (_req, res) => {
  res.json({
    ...imagekit.getAuthenticationParameters(),
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
});
