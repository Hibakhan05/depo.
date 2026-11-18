import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import StockTransaction from '../models/StockTransaction.js';
import { HttpError } from './httpError.js';

export function toQty(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Quantity must be a positive whole number');
  return n;
}

export async function addStock({ product, warehouse, quantity, note, userId }) {
  const wh = await Warehouse.findById(warehouse);
  if (!wh) throw new HttpError(404, 'Warehouse not found');
  if (!(await Product.exists({ _id: product }))) throw new HttpError(404, 'Product not found');
  if (wh.capacity > 0) {
    const [agg] = await Stock.aggregate([{ $match: { warehouse: wh._id } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]);
    if ((agg?.total || 0) + quantity > wh.capacity) {
      throw new HttpError(400, `This would exceed the warehouse capacity of ${wh.capacity} units`);
    }
  }
  const stock = await Stock.findOneAndUpdate(
    { product, warehouse },
    { $inc: { quantity } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const transaction = await StockTransaction.create({ product, warehouse, transactionType: 'stock-in', quantity, note, performedBy: userId });
  return { stock, transaction };
}

// Atomic guarded decrement: the filter makes it impossible for quantity to go below zero.
export const deductStock = (product, warehouse, quantity) =>
  Stock.findOneAndUpdate({ product, warehouse, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true });

export async function removeStock({ product, warehouse, quantity, note, userId }) {
  const stock = await deductStock(product, warehouse, quantity);
  if (!stock) {
    const current = await Stock.findOne({ product, warehouse });
    throw new HttpError(400, `Insufficient stock. Available: ${current?.quantity || 0}`);
  }
  const transaction = await StockTransaction.create({ product, warehouse, transactionType: 'stock-out', quantity, note, performedBy: userId });
  return { stock, transaction };
}

// Stock rows where quantity <= Product.lowStockLimit. Pass warehouse ids to scope, or nothing for all.
export function lowStockPipeline(warehouseIds) {
  return [
    ...(warehouseIds ? [{ $match: { warehouse: { $in: warehouseIds } } }] : []),
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: { $expr: { $lte: ['$quantity', '$product.lowStockLimit'] } } },
    { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
    { $unwind: '$warehouse' },
    { $sort: { quantity: 1 } },
  ];
}
