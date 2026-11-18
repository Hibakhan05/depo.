import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

const PUBLIC_ROLES = ROLES.filter((r) => r !== 'admin');
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (role === 'admin') throw new HttpError(403, 'Admin accounts can only be created by an administrator');
  if (!PUBLIC_ROLES.includes(role)) throw new HttpError(400, 'Choose a valid role');
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  const user = await User.create({ name, email, password, phone, role });
  res.status(201).json({ token: sign(user._id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matches(password))) throw new HttpError(401, 'Incorrect email or password');
  res.json({ token: sign(user._id), user });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('assignedWarehouses', 'name location');
  res.json(user);
});
