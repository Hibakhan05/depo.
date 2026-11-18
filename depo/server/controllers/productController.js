import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { applyImage, deleteImage, verifyImage } from '../utils/image.js';
import { rx } from '../utils/helpers.js';

const FIELDS = ['name', 'description', 'sku', 'category', 'price', 'lowStockLimit'];
const IMG = { urlField: 'imageUrl', idField: 'imageFileId' };

async function checkSupplier(id) {
  if (id && !(await User.exists({ _id: id, role: 'supplier' }))) throw new HttpError(400, 'Selected supplier is not valid');
}

export const createProduct = asyncHandler(async (req, res) => {
  const b = req.body;
  if (!b.imageUrl || !b.imageFileId) throw new HttpError(400, 'A product image is required');
  await checkSupplier(b.supplier);
  await verifyImage(b.imageUrl, b.imageFileId);
  try {
    const product = await Product.create({
      ...Object.fromEntries(FIELDS.map((k) => [k, b[k]])),
      imageUrl: b.imageUrl,
      imageFileId: b.imageFileId,
      supplier: b.supplier || undefined,
      createdBy: req.user._id,
    });
    res.status(201).json(product);
  } catch (err) {
    await deleteImage(b.imageFileId);
    throw err;
  }
});

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: rx(q) }, { sku: rx(q) }];
  if (category) filter.category = category;
  if (req.user.role === 'supplier') filter.supplier = req.user._id;
  const products = await Product.find(filter).populate('supplier', 'name').sort('-createdAt').lean();
  const totals = await Stock.aggregate([{ $group: { _id: '$product', available: { $sum: '$quantity' } } }]);
  const map = new Map(totals.map((t) => [String(t._id), t.available]));
  res.json(products.map((p) => ({ ...p, available: map.get(String(p._id)) || 0 })));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('supplier', 'name email image').lean();
  if (!product) throw new HttpError(404, 'Product not found');
  if (req.user.role === 'supplier' && String(product.supplier?._id) !== String(req.user._id)) {
    throw new HttpError(403, 'You can only view your own products');
  }
  const stock = await Stock.find({ product: product._id }).populate('warehouse', 'name location').lean();
  res.json({ ...product, stock, available: stock.reduce((n, s) => n + s.quantity, 0) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  const b = req.body;
  FIELDS.forEach((k) => { if (b[k] !== undefined) product[k] = b[k]; });
  if (b.supplier !== undefined) {
    await checkSupplier(b.supplier);
    product.supplier = b.supplier || undefined;
  }
  await applyImage(product, IMG, b.imageUrl, b.imageFileId);
  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  if (await Stock.exists({ product: product._id, quantity: { $gt: 0 } })) {
    throw new HttpError(409, 'Remove all stock for this product before deleting it');
  }
  await Stock.deleteMany({ product: product._id });
  await deleteImage(product.imageFileId);
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});
