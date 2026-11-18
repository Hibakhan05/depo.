import SupplyRequest from '../models/SupplyRequest.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { addStock, toQty } from '../utils/stock.js';
import { isAssigned } from '../utils/helpers.js';

const populated = (q) =>
  q.populate('supplier', 'name email').populate('product', 'name sku').populate('warehouse', 'name').populate('reviewedBy', 'name');

export const createRequest = asyncHandler(async (req, res) => {
  const { product, warehouse, quantity } = req.body;
  const prod = await Product.findById(product);
  if (!prod || String(prod.supplier) !== String(req.user._id)) throw new HttpError(403, 'You can only supply your own products');
  if (!(await Warehouse.exists({ _id: warehouse }))) throw new HttpError(404, 'Warehouse not found');
  const doc = await SupplyRequest.create({ supplier: req.user._id, product, warehouse, quantity: toQty(quantity) });
  res.status(201).json(await populated(SupplyRequest.findById(doc._id)));
});

export const listRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'supplier') filter.supplier = req.user._id;
  if (req.user.role === 'warehouseManager') filter.warehouse = { $in: req.user.assignedWarehouses };
  res.json(await populated(SupplyRequest.find(filter).sort('-createdAt')));
});

export const reviewRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) throw new HttpError(400, 'Status must be Approved or Rejected');
  const request = await SupplyRequest.findById(req.params.id);
  if (!request) throw new HttpError(404, 'Request not found');
  if (req.user.role === 'warehouseManager' && !isAssigned(req.user, request.warehouse)) {
    throw new HttpError(403, 'This request is for a warehouse you do not manage');
  }
  const claimed = await SupplyRequest.findOneAndUpdate(
    { _id: request._id, status: 'Pending' },
    { status, reviewedBy: req.user._id },
    { new: true }
  );
  if (!claimed) throw new HttpError(409, 'This request has already been reviewed');
  if (status === 'Approved') {
    try {
      await addStock({
        product: claimed.product, warehouse: claimed.warehouse, quantity: claimed.quantity,
        note: 'Approved supply request', userId: req.user._id,
      });
    } catch (err) {
      await SupplyRequest.updateOne({ _id: claimed._id }, { status: 'Pending', $unset: { reviewedBy: 1 } });
      throw err;
    }
  }
  res.json(await populated(SupplyRequest.findById(claimed._id)));
});
