import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateSplits } from '../src/modules/balances/debtSimplifier';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SplitEase database with realistic demo data...');

  // 1. Clean existing records in reverse order
  await prisma.notification.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const maya = await prisma.user.create({
    data: {
      name: 'Maya Patel',
      email: 'maya@example.com',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const sam = await prisma.user.create({
    data: {
      name: 'Sam Rivera',
      email: 'sam@example.com',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const rohan = await prisma.user.create({
    data: {
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Created 4 demo users (password for all: password123)');

  // 3. Create Group 1: Goa Vacation 2026
  const goaGroup = await prisma.group.create({
    data: {
      name: 'Goa Vacation 2026',
      description: 'Hostel reunion trip to North Goa! Beaches, seafood, and shacks.',
      iconEmoji: '🏖️',
      createdById: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: maya.id, role: 'MEMBER' },
          { userId: sam.id, role: 'MEMBER' },
          { userId: rohan.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Group 1 Expenses
  // Exp 1: Beach Villa Stay (Equal split)
  const exp1Splits = calculateSplits(24000, 'EQUAL', [
    { userId: alex.id },
    { userId: maya.id },
    { userId: sam.id },
    { userId: rohan.id },
  ]);
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      description: 'Beach Villa Stay (3 Nights)',
      amount: 24000,
      category: 'RENT',
      splitType: 'EQUAL',
      paidById: alex.id,
      createdById: alex.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      splits: {
        create: exp1Splits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount,
        })),
      },
    },
  });

  // Exp 2: Seafood Dinner (Equal split)
  const exp2Splits = calculateSplits(4800, 'EQUAL', [
    { userId: alex.id },
    { userId: maya.id },
    { userId: sam.id },
    { userId: rohan.id },
  ]);
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      description: "Seafood Feast at Fisherman's Wharf",
      amount: 4800,
      category: 'FOOD',
      splitType: 'EQUAL',
      paidById: maya.id,
      createdById: maya.id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      splits: {
        create: exp2Splits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount,
        })),
      },
    },
  });

  // Exp 3: Scuba Diving & Watersports (Exact split)
  const exp3Splits = calculateSplits(8000, 'EXACT', [
    { userId: alex.id, value: 2500 },
    { userId: maya.id, value: 2500 },
    { userId: sam.id, value: 1500 },
    { userId: rohan.id, value: 1500 },
  ]);
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      description: 'Grand Island Scuba Diving & Jet Ski',
      amount: 8000,
      category: 'ENTERTAINMENT',
      splitType: 'EXACT',
      paidById: sam.id,
      createdById: sam.id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      splits: {
        create: exp3Splits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
        })),
      },
    },
  });

  // Exp 4: Airport Cabs (Percentage split)
  const exp4Splits = calculateSplits(2400, 'PERCENTAGE', [
    { userId: alex.id, value: 25 },
    { userId: maya.id, value: 25 },
    { userId: sam.id, value: 25 },
    { userId: rohan.id, value: 25 },
  ]);
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      description: 'Airport Innova Cabs',
      amount: 2400,
      category: 'TRAVEL',
      splitType: 'PERCENTAGE',
      paidById: rohan.id,
      createdById: rohan.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      splits: {
        create: exp4Splits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
        })),
      },
    },
  });

  // Exp 5: Snacks & Drinks (Shares split)
  const exp5Splits = calculateSplits(1500, 'SHARES', [
    { userId: alex.id, value: 1 },
    { userId: maya.id, value: 1 },
    { userId: sam.id, value: 2 },
    { userId: rohan.id, value: 1 },
  ]);
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      description: 'Poolside Snacks & Drinks',
      amount: 1500,
      category: 'FOOD',
      splitType: 'SHARES',
      paidById: alex.id,
      createdById: alex.id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      splits: {
        create: exp5Splits.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount,
        })),
      },
    },
  });

  // Group 1 Settlement: Rohan settles ₹2,000 to Alex
  await prisma.settlement.create({
    data: {
      groupId: goaGroup.id,
      fromUserId: rohan.id,
      toUserId: alex.id,
      amount: 2000,
      notes: 'Initial settlement via UPI for villa advance',
      settledAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  // 4. Create Group 2: Flat 402 Roommates
  const flatGroup = await prisma.group.create({
    data: {
      name: 'Flat 402 Roommates',
      description: 'Monthly flat utilities, groceries, and shared domestic bills.',
      iconEmoji: '🏠',
      createdById: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: maya.id, role: 'MEMBER' },
          { userId: sam.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Group 2 Expenses
  const flatExp1 = calculateSplits(1299, 'EQUAL', [
    { userId: alex.id },
    { userId: maya.id },
    { userId: sam.id },
  ]);
  await prisma.expense.create({
    data: {
      groupId: flatGroup.id,
      description: 'High-Speed Fiber Wi-Fi (March)',
      amount: 1299,
      category: 'UTILITIES',
      splitType: 'EQUAL',
      paidById: alex.id,
      createdById: alex.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      splits: {
        create: flatExp1.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount,
        })),
      },
    },
  });

  const flatExp2 = calculateSplits(3450, 'EQUAL', [
    { userId: alex.id },
    { userId: maya.id },
    { userId: sam.id },
  ]);
  await prisma.expense.create({
    data: {
      groupId: flatGroup.id,
      description: 'Monthly Grocery & Cooking Essentials',
      amount: 3450,
      category: 'FOOD',
      splitType: 'EQUAL',
      paidById: maya.id,
      createdById: maya.id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      splits: {
        create: flatExp2.map((s) => ({
          userId: s.userId,
          amountOwed: s.amountOwed,
          shareCount: s.shareCount,
        })),
      },
    },
  });

  // 5. Create demo notifications for Alex
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: 'SETTLEMENT_MADE',
        message: 'Rohan Verma settled ₹2,000.00 with you in Goa Vacation 2026',
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      },
      {
        userId: alex.id,
        type: 'EXPENSE_ADDED',
        message: 'Maya Patel added "Monthly Grocery & Cooking Essentials" (₹3,450.00) in Flat 402 Roommates',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: alex.id,
        type: 'GROUP_INVITE',
        message: 'Welcome to SplitEase! Create groups, split bills, and simplify balances.',
        isRead: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('Database seeded successfully with 2 groups, 7 expenses, 1 settlement, and notifications!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
