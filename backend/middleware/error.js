const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: err.name === 'ValidationError' ? err.errors : err
  });
};
module.exports = errorHandler;
