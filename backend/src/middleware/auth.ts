import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens, setAuthCookies } from '../utils/tokens';
import { prisma } from '../config/db';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true },
        });

        if (user) {
          req.user = user;
          return next();
        }
      }
    }

    // Attempt refresh token fallback if access token missing or expired
    let refreshToken = req.cookies?.refreshToken;
    if (!refreshToken && typeof req.headers['x-refresh-token'] === 'string') {
      refreshToken = req.headers['x-refresh-token'];
    }

    if (refreshToken) {
      const refreshPayload = verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        const user = await prisma.user.findUnique({
          where: { id: refreshPayload.userId },
          select: { id: true, email: true, name: true },
        });

        if (user) {
          const newTokens = generateTokens({ userId: user.id, email: user.email });
          setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);
          res.setHeader('x-access-token', newTokens.accessToken);
          req.user = user;
          return next();
        }
      }
    }

    sendError(res, 'Authentication required. Please log in.', 401);
  } catch (error) {
    sendError(res, 'Authentication failed', 401, error);
  }
};
