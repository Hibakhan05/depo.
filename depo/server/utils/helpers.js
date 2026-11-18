export const rx = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
export const isAssigned = (user, warehouseId) =>
  (user.assignedWarehouses || []).map(String).includes(String(warehouseId?._id || warehouseId));
