export function send(res, success, message, data = null, status = 200) {
  res.status(status).json({
    success,
    message,
    ...(data && { data })
  });
}
