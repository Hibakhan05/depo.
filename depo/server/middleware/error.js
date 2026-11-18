import { HttpError } from '../utils/httpError.js';

export const notFound = (req, _res, next) => next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier supplied';
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyPattern || {})[0] || 'Value'} already exists`;
  }
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal server error' : message });
};
