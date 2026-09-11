import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  iconEmoji: z.string().max(10).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  iconEmoji: z.string().max(10).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});
