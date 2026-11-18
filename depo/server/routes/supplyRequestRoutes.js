import { Router } from 'express';
import { createRequest, listRequests, reviewRequest } from '../controllers/supplyRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.post('/', authorize('supplier'), createRequest);
r.get('/', authorize('admin', 'warehouseManager', 'supplier'), listRequests);
r.put('/:id/status', authorize('admin', 'warehouseManager'), reviewRequest);
export default r;
