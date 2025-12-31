import { verifyToken } from './jwt.js';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ success: false, message: 'Token required' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
