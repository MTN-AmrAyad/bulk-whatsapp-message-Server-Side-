import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getConfig } from 'dotenv-handler';

export interface User {
  id: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, getConfig('JWT_SECRET') as string) as User;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Unauthorized' });
  }
};
