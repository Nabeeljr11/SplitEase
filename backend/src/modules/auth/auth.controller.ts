import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth';
import { setAuthCookies, clearAuthCookies } from '../../utils/tokens';
import { sendSuccess, sendError } from '../../utils/response';

export class AuthController {
  static async signup(req: AuthRequest, res: Response) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.signup(req.body);
      setAuthCookies(res, accessToken, refreshToken);
      return sendSuccess(res, { user, accessToken }, 'Account created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Signup failed', 400);
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);
      setAuthCookies(res, accessToken, refreshToken);
      return sendSuccess(res, { user, accessToken }, 'Login successful');
    } catch (error: any) {
      return sendError(res, error.message || 'Login failed', 401);
    }
  }

  static async logout(_req: AuthRequest, res: Response) {
    clearAuthCookies(res);
    return sendSuccess(res, null, 'Logged out successfully');
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await AuthService.getMe(req.user.id);
      return sendSuccess(res, user);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch profile', 400);
    }
  }

  static async forgotPassword(req: AuthRequest, res: Response) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message || 'Request failed', 400);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response) {
    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message || 'Password reset failed', 400);
    }
  }
}
