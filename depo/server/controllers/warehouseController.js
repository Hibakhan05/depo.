import Warehouse from '../models/Warehouse.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { assignWarehouseManager } from '../utils/sync.js';
import { isAssigned } from '../utils/helpers.js';

async function checkManager(id) {
  if (id && !(await User.exists({ _id: id, role: 'warehouseManager' }))) {
    throw new HttpError(400, 'Selected manager is not a Warehouse Manager');
  }
}

export const createWarehouse = asyncHandler(async (req, res) => {
  const { name, location, capacity, manager } = req.body;
  await checkManager(manager);
  const wh = await Warehouse.create({ name, location, capacity, manager: manager || undefined });
  await assignWarehouseManager(wh._id, wh.manager);
  res.status(201).json(wh);
});

export const listWarehouses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'warehouseManager' ? { _id: { $in: req.user.assignedWarehouses } } : {};
  const list = await Warehouse.find(filter).populate('manager', 'name email').sort('name').lean();
  const sums = await Stock.aggregate([{ $group: { _id: '$warehouse', units: { $sum: '$quantity' }, products: { $sum: 1 } } }]);
  const map = new Map(sums.map((s) => [String(s._id), s]));
  res.json(list.map((w) => ({ ...w, units: map.get(String(w._id))?.units || 0, products: map.get(String(w._id))?.products || 0 })));
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const wh = await Warehouse.findById(req.params.id);
  if (!wh) throw new HttpError(404, 'Warehouse not found');
  const { name, location, capacity, manager } = req.body;
  if (name !== undefined) wh.name = name;
  if (location !== undefined) wh.location = location;
  if (capacity !== undefined) wh.capacity = capacity;
  if (manager !== undefined) {
    await checkManager(manager);
    wh.manager = manager || undefined;
  }
  await wh.save();
  if (manager !== undefined) await assignWarehouseManager(wh._id, wh.manager);
  res.json(wh);
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  const wh = await Warehouse.findById(req.params.id);
  if (!wh) throw new HttpError(404, 'Warehouse not found');
  if (await Stock.exists({ warehouse: wh._id, quantity: { $gt: 0 } })) {
    throw new HttpError(409, 'Move or remove all stock before deleting this warehouse');
  }
  await Stock.deleteMany({ warehouse: wh._id });
  await assignWarehouseManager(wh._id, null);
  await wh.deleteOne();
  res.json({ message: 'Warehouse deleted' });
});

export { isAssigned };
