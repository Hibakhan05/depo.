import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Warehouse from './models/Warehouse.js';
import Stock from './models/Stock.js';
import StockTransaction from './models/StockTransaction.js';
import Order from './models/Order.js';
import SupplyRequest from './models/SupplyRequest.js';

await connectDB();
await Promise.all([User, Product, Warehouse, Stock, StockTransaction, Order, SupplyRequest].map((m) => m.deleteMany({})));

const admin = await User.create({ name: 'Ayesha Khan', email: 'admin@depo.com', password: 'Admin@123', phone: '0300 1112233', role: 'admin' });
const [karachi, lahore] = await Warehouse.create([
  { name: 'Karachi Central', location: 'Korangi Industrial Area, Karachi', capacity: 5000 },
  { name: 'Lahore Hub', location: 'Sundar Industrial Estate, Lahore', capacity: 3000 },
]);
const manager = await User.create({ name: 'Bilal Ahmed', email: 'manager@depo.com', password: 'Manager@123', phone: '0301 2223344', role: 'warehouseManager', assignedWarehouses: [karachi._id] });
const manager2 = await User.create({ name: 'Sana Malik', email: 'manager2@depo.com', password: 'Manager@123', phone: '0302 3334455', role: 'warehouseManager', assignedWarehouses: [lahore._id] });
const supplier = await User.create({ name: 'Nova Tech Supplies', email: 'supplier@depo.com', password: 'Supplier@123', phone: '0303 4445566', role: 'supplier' });
const rep = await User.create({ name: 'Hamza Raza', email: 'sales@depo.com', password: 'Sales@123', phone: '0304 5556677', role: 'salesRepresentative' });
await Warehouse.updateOne({ _id: karachi._id }, { manager: manager._id });
await Warehouse.updateOne({ _id: lahore._id }, { manager: manager2._id });

const base = { supplier: supplier._id, createdBy: admin._id };
const [laptop, keyboard, mouse, monitor, hub, webcam] = await Product.create([
  { ...base, name: 'Laptop 15 inch', sku: 'LAP-001', category: 'Computers', price: 80000, lowStockLimit: 5, description: 'Business laptop, 16 GB RAM, 512 GB SSD.' },
  { ...base, name: 'Mechanical Keyboard', sku: 'KEY-001', category: 'Accessories', price: 1500, lowStockLimit: 10, description: 'Full size wired keyboard.' },
  { ...base, name: 'Wireless Mouse', sku: 'MOU-001', category: 'Accessories', price: 800, lowStockLimit: 10, description: 'Compact 2.4 GHz wireless mouse.' },
  { ...base, name: 'Monitor 24 inch', sku: 'MON-001', category: 'Displays', price: 24000, lowStockLimit: 5, description: 'Full HD IPS monitor.' },
  { ...base, name: 'USB C Hub', sku: 'HUB-001', category: 'Accessories', price: 2200, lowStockLimit: 8, description: 'Seven port USB C hub.' },
  { ...base, name: 'HD Webcam', sku: 'CAM-001', category: 'Accessories', price: 6500, lowStockLimit: 6, description: '1080p webcam with microphone.' },
]);

const levels = [
  [karachi, laptop, 20], [karachi, keyboard, 50], [karachi, mouse, 4], [karachi, monitor, 12], [karachi, hub, 30], [karachi, webcam, 3],
  [lahore, laptop, 8], [lahore, keyboard, 15], [lahore, mouse, 40],
];
await Stock.insertMany(levels.map(([w, p, quantity]) => ({ warehouse: w._id, product: p._id, quantity })));
await StockTransaction.insertMany(
  levels.map(([w, p, quantity]) => ({
    warehouse: w._id, product: p._id, quantity, transactionType: 'stock-in', note: 'Opening stock',
    performedBy: w._id.equals(karachi._id) ? manager._id : manager2._id,
  }))
);

await Order.create({
  orderNumber: 'ORD-SEED-0001', customerName: 'Zubair Traders', customerPhone: '0305 6667788',
  products: [{ product: keyboard._id, quantity: 2, price: 1500 }, { product: mouse._id, quantity: 3, price: 800 }],
  totalAmount: 5400, warehouse: karachi._id, createdBy: rep._id,
});
await SupplyRequest.create({ supplier: supplier._id, product: mouse._id, warehouse: karachi._id, quantity: 100 });

console.log(`
Seed complete. Test accounts:
  Admin              admin@depo.com      Admin@123
  Warehouse Manager  manager@depo.com    Manager@123   (Karachi Central)
  Warehouse Manager  manager2@depo.com   Manager@123   (Lahore Hub)
  Supplier           supplier@depo.com   Supplier@123
  Sales Rep          sales@depo.com      Sales@123
`);
await mongoose.disconnect();
