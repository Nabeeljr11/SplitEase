import { prisma } from '../../config/db';
import { calculateGroupBalances } from './debtSimplifier';

export class BalanceService {
  static async getGroupBalances(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        expenses: {
          include: {
            splits: true,
          },
        },
        settlements: true,
      },
    });

    if (!group) throw new Error('Group not found');

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) throw new Error('You are not a member of this group');

    const participants = group.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
    }));

    const balanceData = calculateGroupBalances(participants, group.expenses, group.settlements);
    const currentUserSummary = balanceData.memberSummaries.find((s) => s.userId === userId);

    // Filter simplified debts involving the current user for quick view
    const userDebtsToPay = balanceData.simplifiedDebts.filter((d) => d.fromUserId === userId);
    const userDebtsToReceive = balanceData.simplifiedDebts.filter((d) => d.toUserId === userId);

    return {
      groupId,
      groupName: group.name,
      ...balanceData,
      currentUser: {
        userId,
        netBalance: currentUserSummary?.netBalance ?? 0,
        totalPaid: currentUserSummary?.totalPaid ?? 0,
        totalOwed: currentUserSummary?.totalOwed ?? 0,
        debtsToPay: userDebtsToPay,
        debtsToReceive: userDebtsToReceive,
      },
    };
  }
}
