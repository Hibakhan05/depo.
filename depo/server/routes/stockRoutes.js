import { Router } from 'express';
import { stockIn, stockOut, listStock, lowStock } from '../controllers/stockController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.post('/in', authorize('warehouseManager'), stockIn);
r.post('/out', authorize('warehouseManager'), stockOut);
r.get('/low', authorize('admin', 'warehouseManager'), lowStock);
r.get('/', authorize('admin', 'warehouseManager', 'salesRepresentative'), listStock);
export default r;
