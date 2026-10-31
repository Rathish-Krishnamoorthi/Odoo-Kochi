import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_super_secure_enterprise_jwt_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  status: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

// Password complexity requirement from prompt:
// - More than 8 characters (> 8)
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one special character
export function validatePasswordComplexity(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length <= 8) {
    return { isValid: false, error: 'Password must be more than 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&* etc).' };
  }
  return { isValid: true };
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function authenticateToken(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Check if user is still active in database
    const userRow = db.prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?').get(decoded.id) as any;
    if (!userRow || userRow.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is inactive or suspended.' });
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      status: userRow.status
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(...roles: Array<'ADMIN' | 'STAFF' | 'CUSTOMER'>) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. You need one of the following roles: [${roles.join(', ')}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
}
