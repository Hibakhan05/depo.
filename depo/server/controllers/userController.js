import User, { ROLES } from '../models/User.js';
import Product from '../models/Product.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { applyImage, deleteImage } from '../utils/image.js';
import { syncManagerWarehouses } from '../utils/sync.js';
import { rx } from '../utils/helpers.js';

const IMG = { urlField: 'image', idField: 'imageFileId' };

export const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: rx(q) }, { email: rx(q) }];
  res.json(await User.find(filter).populate('assignedWarehouses', 'name location').sort('-createdAt'));
});

// Light list used by product forms. Admin and Warehouse Manager only.
export const listSuppliers = asyncHandler(async (_req, res) => {
  res.json(await User.find({ role: 'supplier' }).select('name email image').sort('name'));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, assignedWarehouses, image, imageFileId } = req.body;
  if (!ROLES.includes(role)) throw new HttpError(400, 'Choose a valid role');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const user = new User({ name, email, password, phone, role, assignedWarehouses: role === 'warehouseManager' ? assignedWarehouses || [] : [] });
  await applyImage(user, IMG, image, imageFileId);
  try {
    await user.save();
  } catch (err) {
    await deleteImage(user.imageFileId);
    throw err;
  }
  await syncManagerWarehouses(user);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf = String(req.user._id) === req.params.id;
  if (!isAdmin && !isSelf) throw new HttpError(403, 'You can only edit your own profile');
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  const b = req.body;
  ['name', 'phone'].forEach((k) => { if (b[k] !== undefined) user[k] = b[k]; });
  if (b.password) {
    if (b.password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    user.password = b.password;
  }
  if (isAdmin) {
    if (b.email) user.email = b.email;
    if (b.role) {
      if (!ROLES.includes(b.role)) throw new HttpError(400, 'Choose a valid role');
      if (isSelf && b.role !== 'admin') throw new HttpError(400, 'You cannot remove your own admin access');
      user.role = b.role;
    }
    if (b.assignedWarehouses) user.assignedWarehouses = b.assignedWarehouses;
  }
  if (user.role !== 'warehouseManager') user.assignedWarehouses = [];
  await applyImage(user, IMG, b.image, b.imageFileId);
  await user.save();
  await syncManagerWarehouses(user);
  res.json(await User.findById(user._id).populate('assignedWarehouses', 'name location'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new HttpError(400, 'You cannot delete your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  user.assignedWarehouses = [];
  await syncManagerWarehouses(user);
  await Product.updateMany({ supplier: user._id }, { $unset: { supplier: 1 } });
  await deleteImage(user.imageFileId);
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
