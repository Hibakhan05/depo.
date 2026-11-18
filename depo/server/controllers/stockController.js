import Stock from '../models/Stock.js';
import StockTransaction from '../models/StockTransaction.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { addStock, removeStock, toQty, lowStockPipeline } from '../utils/stock.js';
import { isAssigned } from '../utils/helpers.js';

function guardWarehouse(user, warehouse) {
  if (!warehouse) throw new HttpError(400, 'Warehouse is required');
  if (!isAssigned(user, warehouse)) throw new HttpError(403, 'You can only manage stock in your assigned warehouses');
}

const movement = (fn) => asyncHandler(async (req, res) => {
  const { product, warehouse, quantity, note } = req.body;
  guardWarehouse(req.user, warehouse);
  if (!product) throw new HttpError(400, 'Product is required');
  const result = await fn({ product, warehouse, quantity: toQty(quantity), note, userId: req.user._id });
  res.status(201).json(result);
});

export const stockIn = movement(addStock);
export const stockOut = movement(removeStock);

export const listStock = asyncHandler(async (req, res) => {
  const { warehouse, product } = req.query;
  const filter = {};
  if (warehouse) filter.warehouse = warehouse;
  if (product) filter.product = product;
  if (req.user.role === 'warehouseManager') {
    if (warehouse) guardWarehouse(req.user, warehouse);
    else filter.warehouse = { $in: req.user.assignedWarehouses };
  }
  res.json(
    await Stock.find(filter)
      .populate('product', 'name sku category price lowStockLimit imageUrl')
      .populate('warehouse', 'name location')
      .sort('-updatedAt')
  );
});

export const lowStock = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'warehouseManager' ? req.user.assignedWarehouses : undefined;
  res.json(await Stock.aggregate(lowStockPipeline(scope)));
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { warehouse, type, product } = req.query;
  const filter = {};
  if (type) filter.transactionType = type;
  if (product) filter.product = product;
  if (warehouse) filter.warehouse = warehouse;
  if (req.user.role === 'warehouseManager') {
    if (warehouse) guardWarehouse(req.user, warehouse);
    else filter.warehouse = { $in: req.user.assignedWarehouses };
  }
  res.json(
    await StockTransaction.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('performedBy', 'name role')
      .sort('-date')
      .limit(500)
  );
});
