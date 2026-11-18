import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import Warehouse from '../models/Warehouse.js';
import StockTransaction from '../models/StockTransaction.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { deductStock, toQty } from '../utils/stock.js';
import { isAssigned, rx } from '../utils/helpers.js';

const populated = (q) =>
  q.populate('warehouse', 'name location').populate('createdBy', 'name email').populate('products.product', 'name sku imageUrl');

const orderNumber = () =>
  `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

function canView(user, order) {
  if (user.role === 'admin') return true;
  if (user.role === 'salesRepresentative') return String(order.createdBy._id || order.createdBy) === String(user._id);
  if (user.role === 'warehouseManager') return isAssigned(user, order.warehouse);
  return false;
}

export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, warehouse, items } = req.body;
  if (!customerName?.trim()) throw new HttpError(400, 'Customer name is required');
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Add at least one product');
  const wh = await Warehouse.findById(warehouse);
  if (!wh) throw new HttpError(404, 'Warehouse not found');

  const wanted = new Map();
  for (const it of items) {
    const key = String(it.product);
    wanted.set(key, (wanted.get(key) || 0) + toQty(it.quantity));
  }
  const ids = [...wanted.keys()];
  const [products, stocks] = await Promise.all([
    Product.find({ _id: { $in: ids } }),
    Stock.find({ warehouse, product: { $in: ids } }),
  ]);
  if (products.length !== ids.length) throw new HttpError(400, 'One or more products no longer exist');

  let totalAmount = 0;
  const lines = products.map((p) => {
    const quantity = wanted.get(String(p._id));
    const available = stocks.find((s) => String(s.product) === String(p._id))?.quantity || 0;
    if (quantity > available) throw new HttpError(400, `Only ${available} units of ${p.name} are available in ${wh.name}`);
    totalAmount += quantity * p.price; // price always comes from the database, never the client
    return { product: p._id, quantity, price: p.price };
  });

  const order = await Order.create({
    orderNumber: orderNumber(), customerName, customerPhone, products: lines, totalAmount, warehouse, createdBy: req.user._id,
  });
  res.status(201).json(await populated(Order.findById(order._id)));
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [{ orderNumber: rx(q) }, { customerName: rx(q) }];
  if (req.user.role === 'salesRepresentative') filter.createdBy = req.user._id;
  if (req.user.role === 'warehouseManager') filter.warehouse = { $in: req.user.assignedWarehouses };
  res.json(await populated(Order.find(filter).sort('-createdAt')));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await populated(Order.findById(req.params.id));
  if (!order) throw new HttpError(404, 'Order not found');
  if (!canView(req.user, order)) throw new HttpError(403, 'You do not have access to this order');
  res.json(order);
});

// Pending to Processing. The Pending filter is the guard that makes deduction happen exactly once.
async function processOrder(order, userId) {
  const claimed = await Order.findOneAndUpdate({ _id: order._id, status: 'Pending' }, { status: 'Processing' }, { new: true });
  if (!claimed) throw new HttpError(409, 'This order has already been processed or cancelled');
  const deducted = [];
  try {
    for (const line of claimed.products) {
      const ok = await deductStock(line.product, claimed.warehouse, line.quantity);
      if (!ok) {
        const p = await Product.findById(line.product).select('name');
        throw new HttpError(400, `Insufficient stock for ${p?.name || 'a product'}. Order stays Pending`);
      }
      deducted.push(line);
    }
  } catch (err) {
    // Compensate: give back what was taken and release the order.
    await Promise.all(deducted.map((l) => Stock.updateOne({ product: l.product, warehouse: claimed.warehouse }, { $inc: { quantity: l.quantity } })));
    await Order.updateOne({ _id: claimed._id }, { status: 'Pending' });
    throw err;
  }
  await StockTransaction.insertMany(
    claimed.products.map((l) => ({
      product: l.product, warehouse: claimed.warehouse, transactionType: 'stock-out',
      quantity: l.quantity, note: `Order ${claimed.orderNumber}`, performedBy: userId,
    }))
  );
}

const FLOW = { Pending: ['Processing', 'Cancelled'], Processing: ['Completed'] };

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (req.user.role === 'warehouseManager' && !isAssigned(req.user, order.warehouse)) {
    throw new HttpError(403, 'This order belongs to a warehouse you do not manage');
  }
  if (!FLOW[order.status]?.includes(status)) {
    throw new HttpError(400, `An order that is ${order.status} cannot move to ${status}`);
  }
  if (status === 'Processing') {
    await processOrder(order, req.user._id);
  } else {
    const updated = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, { status }, { new: true });
    if (!updated) throw new HttpError(409, 'Order status changed. Refresh and try again');
  }
  res.json(await populated(Order.findById(order._id)));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const updated = await Order.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id, status: 'Pending' },
    { status: 'Cancelled' },
    { new: true }
  );
  if (!updated) {
    const own = await Order.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!own) throw new HttpError(404, 'Order not found');
    throw new HttpError(400, 'Only Pending orders can be cancelled');
  }
  res.json(await populated(Order.findById(updated._id)));
});
