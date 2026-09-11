import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[Unhandled Error]:', err);
  sendError(res, err.message || 'Internal server error', 500);
};
