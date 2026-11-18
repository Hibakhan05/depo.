import mongoose from 'mongoose';
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    products: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
