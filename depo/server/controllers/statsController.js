import User from '../models/User.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Order from '../models/Order.js';
import Stock from '../models/Stock.js';
import SupplyRequest from '../models/SupplyRequest.js';
import { asyncHandler } from '../utils/httpError.js';
import { lowStockPipeline } from '../utils/stock.js';

const countLow = async (scope) => (await Stock.aggregate([...lowStockPipeline(scope), { $count: 'n' }]))[0]?.n || 0;

export const getStats = asyncHandler(async (req, res) => {
  const u = req.user;
  let cards = [];

  if (u.role === 'admin') {
    const [users, products, warehouses, suppliers, orders, low] = await Promise.all([
      User.countDocuments(), Product.countDocuments(), Warehouse.countDocuments(),
      User.countDocuments({ role: 'supplier' }), Order.countDocuments(), countLow(),
    ]);
    cards = [
      { label: 'Users', value: users }, { label: 'Products', value: products }, { label: 'Warehouses', value: warehouses },
      { label: 'Suppliers', value: suppliers }, { label: 'Orders', value: orders }, { label: 'Low stock alerts', value: low, tone: 'warn' },
    ];
  } else if (u.role === 'warehouseManager') {
    const ids = u.assignedWarehouses;
    const [units, low, pendingOrders, pendingRequests] = await Promise.all([
      Stock.aggregate([{ $match: { warehouse: { $in: ids } } }, { $group: { _id: null, n: { $sum: '$quantity' } } }]),
      countLow(ids),
      Order.countDocuments({ warehouse: { $in: ids }, status: 'Pending' }),
      SupplyRequest.countDocuments({ warehouse: { $in: ids }, status: 'Pending' }),
    ]);
    cards = [
      { label: 'Assigned warehouses', value: ids.length }, { label: 'Units in stock', value: units[0]?.n || 0 },
      { label: 'Low stock alerts', value: low, tone: 'warn' }, { label: 'Orders to process', value: pendingOrders },
      { label: 'Supply requests to review', value: pendingRequests },
    ];
  } else if (u.role === 'supplier') {
    const [products, pending, approved, rejected] = await Promise.all([
      Product.countDocuments({ supplier: u._id }),
      SupplyRequest.countDocuments({ supplier: u._id, status: 'Pending' }),
      SupplyRequest.countDocuments({ supplier: u._id, status: 'Approved' }),
      SupplyRequest.countDocuments({ supplier: u._id, status: 'Rejected' }),
    ]);
    cards = [{ label: 'My products', value: products }, { label: 'Pending requests', value: pending }, { label: 'Approved', value: approved }, { label: 'Rejected', value: rejected }];
  } else {
    const [orders, pending, completed, sales] = await Promise.all([
      Order.countDocuments({ createdBy: u._id }),
      Order.countDocuments({ createdBy: u._id, status: 'Pending' }),
      Order.countDocuments({ createdBy: u._id, status: 'Completed' }),
      Order.aggregate([{ $match: { createdBy: u._id, status: { $ne: 'Cancelled' } } }, { $group: { _id: null, n: { $sum: '$totalAmount' } } }]),
    ]);
    cards = [{ label: 'My orders', value: orders }, { label: 'Pending', value: pending }, { label: 'Completed', value: completed }, { label: 'Order value', value: sales[0]?.n || 0, money: true }];
  }
  res.json({ cards });
});
