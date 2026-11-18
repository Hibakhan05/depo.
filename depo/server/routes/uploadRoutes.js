import { Router } from 'express';
import { getUploadAuth } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.get('/auth', protect, getUploadAuth);
export default r;
