import { Router } from 'express';
import { listUsers, listSuppliers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/suppliers', authorize('admin', 'warehouseManager'), listSuppliers);
r.get('/', authorize('admin'), listUsers);
r.post('/', authorize('admin'), createUser);
r.put('/:id', updateUser); // admin, or the user editing themselves (checked in controller)
r.delete('/:id', authorize('admin'), deleteUser);
export default r;
