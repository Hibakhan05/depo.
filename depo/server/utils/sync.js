import User from '../models/User.js';
import Warehouse from '../models/Warehouse.js';

// Keeps User.assignedWarehouses and Warehouse.manager consistent after a user changes.
export async function syncManagerWarehouses(user) {
  const ids = user.role === 'warehouseManager' ? user.assignedWarehouses : [];
  await Warehouse.updateMany({ manager: user._id, _id: { $nin: ids } }, { $unset: { manager: 1 } });
  if (ids.length) {
    await Warehouse.updateMany({ _id: { $in: ids } }, { manager: user._id });
    await User.updateMany({ _id: { $ne: user._id } }, { $pull: { assignedWarehouses: { $in: ids } } });
  }
}

// Keeps both sides consistent after a warehouse changes its manager.
export async function assignWarehouseManager(warehouseId, managerId) {
  await User.updateMany({ _id: { $ne: managerId || null }, assignedWarehouses: warehouseId }, { $pull: { assignedWarehouses: warehouseId } });
  if (managerId) await User.updateOne({ _id: managerId, role: 'warehouseManager' }, { $addToSet: { assignedWarehouses: warehouseId } });
}
