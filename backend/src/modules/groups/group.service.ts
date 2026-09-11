import { prisma } from '../../config/db';
import { calculateGroupBalances } from '../balances/debtSimplifier';

export class GroupService {
  static async createGroup(userId: string, data: { name: string; description?: string; iconEmoji?: string }) {
    return prisma.group.create({
      data: {
        name: data.name,
        description: data.description || null,
        iconEmoji: data.iconEmoji || '💰',
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  static async getUserGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
            expenses: {
              include: {
                splits: true,
              },
            },
            settlements: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((m) => {
      const g = m.group;
      const participants = g.members.map((mem) => ({
        id: mem.user.id,
        name: mem.user.name,
        avatarUrl: mem.user.avatarUrl,
      }));

      const { memberSummaries } = calculateGroupBalances(participants, g.expenses, g.settlements);
      const userSummary = memberSummaries.find((s) => s.userId === userId);

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        iconEmoji: g.iconEmoji,
        inviteCode: g.inviteCode,
        role: m.role,
        createdAt: g.createdAt,
        memberCount: g.members.length,
        members: g.members.map((mem) => mem.user),
        userNetBalance: userSummary?.netBalance ?? 0,
        userTotalPaid: userSummary?.totalPaid ?? 0,
        userTotalOwed: userSummary?.totalOwed ?? 0,
      };
    });
  }

  static async getGroupById(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const membership = group.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new Error('You are not a member of this group');
    }

    return {
      ...group,
      currentUserRole: membership.role,
    };
  }

  static async updateGroup(
    groupId: string,
    userId: string,
    data: { name?: string; description?: string; iconEmoji?: string }
  ) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new Error('Only group admins can update group settings');
    }

    return prisma.group.update({
      where: { id: groupId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.iconEmoji ? { iconEmoji: data.iconEmoji } : {}),
      },
    });
  }

  static async deleteGroup(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.role !== 'ADMIN') {
      throw new Error('Only group admins can delete the group');
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    return { message: 'Group deleted successfully' };
  }

  static async inviteMemberByEmail(groupId: string, inviterId: string, email: string) {
    const inviterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviterId } },
      include: { group: true },
    });

    if (!inviterMembership) {
      throw new Error('You are not a member of this group');
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userToInvite) {
      throw new Error(`User with email "${email}" not found. Please ask them to sign up for SplitEase first!`);
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: userToInvite.id } },
    });

    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: userToInvite.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: userToInvite.id,
        type: 'GROUP_INVITE',
        message: `You were added to group "${inviterMembership.group.name}"`,
      },
    });

    return newMember;
  }

  static async joinGroupByInviteCode(userId: string, inviteCode: string) {
    const group = await prisma.group.findUnique({
      where: { inviteCode },
    });

    if (!group) {
      throw new Error('Invalid invite link or code');
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existingMember) {
      return { group, message: 'You are already a member of this group' };
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'MEMBER',
      },
    });

    return { group, message: 'Successfully joined group' };
  }

  static async removeMember(groupId: string, adminId: string, memberIdToRemove: string) {
    const adminMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });

    if (!adminMembership || adminMembership.role !== 'ADMIN') {
      throw new Error('Only admins can remove members');
    }

    if (adminId === memberIdToRemove) {
      throw new Error('You cannot remove yourself. Use "Leave Group" instead.');
    }

    // Check if member has unsettled balance
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        expenses: { include: { splits: true } },
        settlements: true,
      },
    });

    if (!group) throw new Error('Group not found');

    const participants = group.members.map((m) => ({ id: m.user.id, name: m.user.name }));
    const { memberSummaries } = calculateGroupBalances(participants, group.expenses, group.settlements);
    const memberBalance = memberSummaries.find((s) => s.userId === memberIdToRemove)?.netBalance || 0;

    if (Math.abs(memberBalance) > 0.01) {
      throw new Error(
        `Cannot remove member with unsettled balance (₹${memberBalance.toFixed(2)}). Please settle debts first.`
      );
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberIdToRemove } },
    });

    return { message: 'Member removed successfully' };
  }

  static async leaveGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        expenses: { include: { splits: true } },
        settlements: true,
      },
    });

    if (!group) throw new Error('Group not found');

    const membership = group.members.find((m) => m.userId === userId);
    if (!membership) throw new Error('You are not a member of this group');

    // Check balance
    const participants = group.members.map((m) => ({ id: m.user.id, name: m.user.name }));
    const { memberSummaries } = calculateGroupBalances(participants, group.expenses, group.settlements);
    const userBalance = memberSummaries.find((s) => s.userId === userId)?.netBalance || 0;

    if (Math.abs(userBalance) > 0.01) {
      throw new Error(
        `You cannot leave the group with an unsettled balance of ₹${userBalance.toFixed(2)}. Please settle all debts first.`
      );
    }

    // If leaving member is admin and other members exist, promote another member to admin
    if (membership.role === 'ADMIN') {
      const remainingMembers = group.members.filter((m) => m.userId !== userId);
      if (remainingMembers.length > 0) {
        await prisma.groupMember.update({
          where: { id: remainingMembers[0].id },
          data: { role: 'ADMIN' },
        });
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    return { message: 'You have left the group' };
  }
}
