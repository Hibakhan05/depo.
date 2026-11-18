import { Router } from 'express';
import { createWarehouse, listWarehouses, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.route('/').get(listWarehouses).post(authorize('admin'), createWarehouse);
r.route('/:id').put(authorize('admin'), updateWarehouse).delete(authorize('admin'), deleteWarehouse);
export default r;
