import { prisma } from '../../config/db';

export class SettlementService {
  static async createSettlement(
    groupId: string,
    currentUserId: string,
    data: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      notes?: string;
      settledAt?: string;
    }
  ) {
    // 1. Verify group & membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });

    if (!group) throw new Error('Group not found');

    const memberIds = new Set(group.members.map((m) => m.userId));
    if (!memberIds.has(currentUserId)) {
      throw new Error('You are not a member of this group');
    }

    if (!memberIds.has(data.fromUserId) || !memberIds.has(data.toUserId)) {
      throw new Error('Both sender and receiver must be members of the group');
    }

    if (data.fromUserId === data.toUserId) {
      throw new Error('Cannot settle debt with yourself');
    }

    // 2. Create settlement record
    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.settlement.create({
        data: {
          groupId,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          amount: data.amount,
          notes: data.notes || null,
          settledAt: data.settledAt ? new Date(data.settledAt) : new Date(),
        },
        include: {
          fromUser: { select: { id: true, name: true, avatarUrl: true } },
          toUser: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // 3. Notify the receiver (if receiver is not current user) or sender
      const recipientId = currentUserId === data.fromUserId ? data.toUserId : data.fromUserId;
      await tx.notification.create({
        data: {
          userId: recipientId,
          type: 'SETTLEMENT_MADE',
          message: `${created.fromUser.name} recorded a settlement of ₹${data.amount.toFixed(2)} to ${created.toUser.name} in ${group.name}`,
        },
      });

      return created;
    });

    return settlement;
  }

  static async getGroupSettlements(groupId: string, userId: string) {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!isMember) throw new Error('You are not a member of this group');

    return prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { settledAt: 'desc' },
    });
  }

  static async deleteSettlement(settlementId: string, userId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: { include: { members: true } },
      },
    });

    if (!settlement) throw new Error('Settlement not found');

    const membership = settlement.group.members.find((m) => m.userId === userId);
    if (!membership) throw new Error('You are not a member of this group');

    const canDelete =
      settlement.fromUserId === userId ||
      settlement.toUserId === userId ||
      membership.role === 'ADMIN';

    if (!canDelete) {
      throw new Error('You do not have permission to delete this settlement');
    }

    await prisma.settlement.delete({
      where: { id: settlementId },
    });

    return { message: 'Settlement deleted successfully' };
  }
}
