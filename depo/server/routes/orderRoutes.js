import { Router } from 'express';
import { createOrder, listOrders, getOrder, updateStatus, cancelOrder } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.post('/', authorize('salesRepresentative'), createOrder);
r.get('/', authorize('admin', 'warehouseManager', 'salesRepresentative'), listOrders);
r.get('/:id', authorize('admin', 'warehouseManager', 'salesRepresentative'), getOrder);
r.put('/:id/status', authorize('admin', 'warehouseManager'), updateStatus);
r.put('/:id/cancel', authorize('salesRepresentative'), cancelOrder);
export default r;
