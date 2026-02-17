function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, _res, next) {
  next(createHttpError(404, `Not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = typeof err.message === 'string' && err.message ? err.message : 'Internal server error';

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}`, err);
  }

  res.status(status).json({ error: message });
}

module.exports = {
  createHttpError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
