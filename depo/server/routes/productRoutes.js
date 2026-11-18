import { Router } from 'express';
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.route('/').get(listProducts).post(authorize('admin', 'warehouseManager'), createProduct);
r.route('/:id').get(getProduct).put(authorize('admin', 'warehouseManager'), updateProduct).delete(authorize('admin'), deleteProduct);
export default r;
