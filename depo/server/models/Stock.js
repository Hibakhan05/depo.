import mongoose from 'mongoose';
const { Schema } = mongoose;

const stockSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
// One Stock record per product per warehouse.
stockSchema.index({ product: 1, warehouse: 1 }, { unique: true });

export default mongoose.model('Stock', stockSchema);
