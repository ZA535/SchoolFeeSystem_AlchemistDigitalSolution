import jwt from 'jsonwebtoken';
import { ApiMessage, InfraMessage } from '../enums/messages.js';

const ROLES = ['admin', 'accountant', 'viewer'];

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(InfraMessage.JWT_SECRET_INVALID);
  }
  return secret;
}

export function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    },
    getJwtSecret(),
    { expiresIn }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: ApiMessage.AUTHENTICATION_REQUIRED });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ error: ApiMessage.INVALID_OR_EXPIRED_SESSION });
  }
}

export function requireRole(...allowed) {
  const set = new Set(allowed);
  return (req, res, next) => {
    if (!req.user?.role || !set.has(req.user.role)) {
      return res.status(403).json({ error: ApiMessage.INSUFFICIENT_PERMISSIONS });
    }
    next();
  };
}

export function canWriteStudents(role) {
  return role === 'admin' || role === 'accountant';
}

export function canCollectFees(role) {
  return role === 'admin' || role === 'accountant';
}

export function canManageUsers(role) {
  return role === 'admin';
}

export { ROLES };
