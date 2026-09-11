import { prisma } from '../../config/db';
import { calculateSplits, SplitType, SplitInput } from '../balances/debtSimplifier';

export class ExpenseService {
  static async createExpense(
    groupId: string,
    createdById: string,
    data: {
      description: string;
      amount: number;
      category: string;
      splitType: SplitType;
      date?: string;
      paidById: string;
      splits: SplitInput[];
    }
  ) {
    // 1. Verify group exists and creator is member
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) throw new Error('Group not found');

    const isMember = group.members.some((m) => m.userId === createdById);
    if (!isMember) throw new Error('You must be a group member to add expenses');

    // 2. Validate all split participants and payer are group members
    const memberIdSet = new Set(group.members.map((m) => m.userId));
    if (!memberIdSet.has(data.paidById)) {
      throw new Error('Payer is not a member of this group');
    }

    for (const split of data.splits) {
      if (!memberIdSet.has(split.userId)) {
        throw new Error(`Participant ${split.userId} is not a member of this group`);
      }
    }

    // 3. Compute precise split amounts
    const calculatedSplits = calculateSplits(data.amount, data.splitType, data.splits);

    // 4. Save Expense and Splits in transaction
    const expense = await prisma.$transaction(async (tx) => {
      const createdExpense = await tx.expense.create({
        data: {
          groupId,
          description: data.description,
          amount: data.amount,
          category: data.category || 'OTHER',
          splitType: data.splitType || 'EQUAL',
          date: data.date ? new Date(data.date) : new Date(),
          paidById: data.paidById,
          createdById,
          splits: {
            create: calculatedSplits.map((s) => ({
              userId: s.userId,
              amountOwed: s.amountOwed,
              shareCount: s.shareCount || null,
            })),
          },
        },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      });

      // 5. Create notifications for members involved (excluding the creator)
      const notificationRecipients = calculatedSplits
        .map((s) => s.userId)
        .filter((uid) => uid !== createdById);

      if (notificationRecipients.length > 0) {
        await tx.notification.createMany({
          data: notificationRecipients.map((uid) => ({
            userId: uid,
            type: 'EXPENSE_ADDED',
            message: `New expense "${data.description}" (₹${data.amount.toFixed(2)}) added in ${group.name}`,
          })),
        });
      }

      return createdExpense;
    });

    return expense;
  }

  static async getGroupExpenses(
    groupId: string,
    userId: string,
    query: {
      category?: string;
      memberId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) throw new Error('You are not a member of this group');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = { groupId };

    if (query.category && query.category !== 'ALL') {
      whereClause.category = query.category;
    }

    if (query.memberId && query.memberId !== 'ALL') {
      whereClause.OR = [
        { paidById: query.memberId },
        { splits: { some: { userId: query.memberId } } },
      ];
    }

    if (query.startDate || query.endDate) {
      whereClause.date = {};
      if (query.startDate) whereClause.date.gte = new Date(query.startDate);
      if (query.endDate) whereClause.date.lte = new Date(query.endDate);
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where: whereClause }),
      prisma.expense.findMany({
        where: whereClause,
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getExpenseById(expenseId: string, userId: string) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: { include: { members: true } },
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!expense) throw new Error('Expense not found');

    const isMember = expense.group.members.some((m) => m.userId === userId);
    if (!isMember) throw new Error('You do not have access to this expense');

    return expense;
  }

  static async updateExpense(
    expenseId: string,
    userId: string,
    data: {
      description?: string;
      amount?: number;
      category?: string;
      splitType?: SplitType;
      date?: string;
      paidById?: string;
      splits?: SplitInput[];
    }
  ) {
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: { include: { members: true } },
      },
    });

    if (!existing) throw new Error('Expense not found');

    const userMembership = existing.group.members.find((m) => m.userId === userId);
    if (!userMembership) throw new Error('You are not a member of this group');

    const canEdit =
      existing.createdById === userId ||
      existing.paidById === userId ||
      userMembership.role === 'ADMIN';

    if (!canEdit) {
      throw new Error('Only the expense creator, payer, or group admin can edit this expense');
    }

    const newAmount = data.amount ?? existing.amount;
    const newSplitType = data.splitType ?? (existing.splitType as SplitType);

    return prisma.$transaction(async (tx) => {
      let splitsToCreate;
      if (data.splits) {
        // Recalculate
        const calculated = calculateSplits(newAmount, newSplitType, data.splits);
        await tx.expenseSplit.deleteMany({ where: { expenseId } });
        splitsToCreate = calculated.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount || null,
        }));
      }

      return tx.expense.update({
        where: { id: expenseId },
        data: {
          ...(data.description ? { description: data.description } : {}),
          ...(data.amount ? { amount: data.amount } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.splitType ? { splitType: data.splitType } : {}),
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.paidById ? { paidById: data.paidById } : {}),
          ...(splitsToCreate ? { splits: { create: splitsToCreate } } : {}),
        },
        include: {
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      });
    });
  }

  static async deleteExpense(expenseId: string, userId: string) {
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: { include: { members: true } },
      },
    });

    if (!existing) throw new Error('Expense not found');

    const userMembership = existing.group.members.find((m) => m.userId === userId);
    if (!userMembership) throw new Error('You are not a member of this group');

    const canDelete =
      existing.createdById === userId ||
      existing.paidById === userId ||
      userMembership.role === 'ADMIN';

    if (!canDelete) {
      throw new Error('Only the expense creator, payer, or group admin can delete this expense');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return { message: 'Expense deleted successfully' };
  }
}
