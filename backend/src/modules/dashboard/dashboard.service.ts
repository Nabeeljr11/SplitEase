import { prisma } from '../../config/db';
import { calculateGroupBalances } from '../balances/debtSimplifier';

export class DashboardService {
  static async getSummary(userId: string) {
    // 1. Fetch all groups user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
            expenses: {
              include: { splits: true },
            },
            settlements: true,
          },
        },
      },
    });

    let totalOwedToUser = 0;
    let totalUserOwes = 0;
    const groupSummaries = [];

    for (const m of memberships) {
      const g = m.group;
      const participants = g.members.map((mem) => ({
        id: mem.user.id,
        name: mem.user.name,
        avatarUrl: mem.user.avatarUrl,
      }));

      const { memberSummaries, simplifiedDebts } = calculateGroupBalances(
        participants,
        g.expenses,
        g.settlements
      );

      const userSummary = memberSummaries.find((s) => s.userId === userId);
      const net = userSummary?.netBalance ?? 0;

      if (net > 0) {
        totalOwedToUser += net;
      } else if (net < 0) {
        totalUserOwes += Math.abs(net);
      }

      // Find debts user needs to pay or receive in this group
      const debtsToPay = simplifiedDebts.filter((d) => d.fromUserId === userId);
      const debtsToReceive = simplifiedDebts.filter((d) => d.toUserId === userId);

      groupSummaries.push({
        groupId: g.id,
        groupName: g.name,
        iconEmoji: g.iconEmoji,
        netBalance: net,
        debtsToPay,
        debtsToReceive,
      });
    }

    // 2. Spending by category across user's splits in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userSplitsLast30 = await prisma.expenseSplit.findMany({
      where: {
        userId,
        expense: {
          date: { gte: thirtyDaysAgo },
        },
      },
      include: {
        expense: {
          select: {
            category: true,
            amount: true,
            date: true,
          },
        },
      },
    });

    const categoryMap = new Map<string, number>();
    const defaultCategories = ['FOOD', 'TRAVEL', 'RENT', 'UTILITIES', 'ENTERTAINMENT', 'OTHER'];
    for (const cat of defaultCategories) {
      categoryMap.set(cat, 0);
    }

    for (const split of userSplitsLast30) {
      const cat = split.expense.category || 'OTHER';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + split.amountOwed);
    }

    const categorySpending = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }));

    // 3. Recent activity feed (both expenses and settlements from user's groups)
    const groupIds = memberships.map((m) => m.groupId);

    const [recentExpenses, recentSettlements] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: { in: groupIds } },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true, iconEmoji: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.settlement.findMany({
        where: { groupId: { in: groupIds } },
        include: {
          fromUser: { select: { id: true, name: true, avatarUrl: true } },
          toUser: { select: { id: true, name: true, avatarUrl: true } },
          group: { select: { id: true, name: true, iconEmoji: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const activityFeed = [
      ...recentExpenses.map((exp) => ({
        id: exp.id,
        type: 'EXPENSE' as const,
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        createdAt: exp.createdAt,
        group: exp.group,
        actor: exp.paidBy,
        subtitle: `${exp.paidBy.name} paid ₹${exp.amount.toFixed(2)} in ${exp.group.name}`,
      })),
      ...recentSettlements.map((st) => ({
        id: st.id,
        type: 'SETTLEMENT' as const,
        description: `${st.fromUser.name} paid ${st.toUser.name}`,
        amount: st.amount,
        category: 'SETTLEMENT',
        date: st.settledAt,
        createdAt: st.createdAt,
        group: st.group,
        actor: st.fromUser,
        subtitle: `${st.fromUser.name} settled ₹${st.amount.toFixed(2)} with ${st.toUser.name} in ${st.group.name}`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    return {
      totalNetBalance: Math.round((totalOwedToUser - totalUserOwes) * 100) / 100,
      totalOwedToUser: Math.round(totalOwedToUser * 100) / 100,
      totalUserOwes: Math.round(totalUserOwes * 100) / 100,
      groupsCount: memberships.length,
      groupSummaries,
      categorySpending,
      activityFeed,
    };
  }
}
