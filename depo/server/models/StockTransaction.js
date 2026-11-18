import mongoose from 'mongoose';
const { Schema } = mongoose;

const transactionSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  transactionType: { type: String, enum: ['stock-in', 'stock-out'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String, trim: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
});

export default mongoose.model('StockTransaction', transactionSchema);
