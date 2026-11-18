import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;
export const ROLES = ['admin', 'warehouseManager', 'supplier', 'salesRepresentative'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, required: true },
    assignedWarehouses: [{ type: Schema.Types.ObjectId, ref: 'Warehouse' }],
    image: String,
    imageFileId: String,
  },
  {
    timestamps: true,
    toJSON: { transform: (_d, r) => { delete r.password; return r; } },
  }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.matches = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
