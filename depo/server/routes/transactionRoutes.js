import { Router } from 'express';
import { listTransactions } from '../controllers/stockController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.get('/', protect, authorize('admin', 'warehouseManager'), listTransactions);
export default r;
