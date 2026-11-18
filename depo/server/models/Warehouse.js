import mongoose from 'mongoose';
const { Schema } = mongoose;

const warehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Warehouse', warehouseSchema);
