const { ZodError } = require('zod');

function notFound(req, res) {
  return res.status(404).json({ error: { message: 'Not found' } });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { message: 'Validation error', details: err.errors } });
  }

  const status = Number(err.statusCode || err.status || 500);
  const message = err.publicMessage || err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  return res.status(status).json({ error: { message } });
}

module.exports = { notFound, errorHandler };
