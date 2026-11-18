import mongoose from 'mongoose';
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, trim: true, default: 'General' },
    price: { type: Number, required: true, min: 0 },
    lowStockLimit: { type: Number, default: 10, min: 0 },
    imageUrl: String,
    imageFileId: String,
    supplier: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
