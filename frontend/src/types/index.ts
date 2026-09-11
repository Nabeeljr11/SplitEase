export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export type GroupRole = 'ADMIN' | 'MEMBER';

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  iconEmoji: string;
  inviteCode: string;
  role?: GroupRole;
  createdAt: string;
  memberCount: number;
  members: User[];
  userNetBalance: number;
  userTotalPaid?: number;
  userTotalOwed?: number;
}

export interface GroupDetail extends Omit<Group, 'members'> {
  createdById: string;
  createdBy: User;
  currentUserRole: GroupRole;
  members: {
    id: string;
    groupId: string;
    userId: string;
    role: GroupRole;
    joinedAt: string;
    user: User;
  }[];
}

export type ExpenseCategory = 'FOOD' | 'TRAVEL' | 'RENT' | 'UTILITIES' | 'ENTERTAINMENT' | 'OTHER';
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amountOwed: number;
  shareCount?: number | null;
  user: User;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  date: string;
  paidById: string;
  paidBy: User;
  createdById: string;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  fromUser: User;
  toUserId: string;
  toUser: User;
  amount: number;
  notes?: string | null;
  settledAt: string;
  createdAt: string;
}

export interface MemberBalanceSummary {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
}

export interface PairwiseDebt {
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string | null;
  amount: number;
}

export interface GroupBalanceResponse {
  groupId: string;
  groupName: string;
  memberSummaries: MemberBalanceSummary[];
  pairwiseDebts: PairwiseDebt[];
  simplifiedDebts: SimplifiedDebt[];
  currentUser: {
    userId: string;
    netBalance: number;
    totalPaid: number;
    totalOwed: number;
    debtsToPay: SimplifiedDebt[];
    debtsToReceive: SimplifiedDebt[];
  };
}

export interface ActivityItem {
  id: string;
  type: 'EXPENSE' | 'SETTLEMENT';
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  subtitle: string;
  actor: User;
  group: {
    id: string;
    name: string;
    iconEmoji: string;
  };
}

export interface DashboardSummary {
  totalNetBalance: number;
  totalOwedToUser: number;
  totalUserOwes: number;
  groupsCount: number;
  groupSummaries: {
    groupId: string;
    groupName: string;
    iconEmoji: string;
    netBalance: number;
    debtsToPay: SimplifiedDebt[];
    debtsToReceive: SimplifiedDebt[];
  }[];
  categorySpending: {
    category: string;
    amount: number;
  }[];
  activityFeed: ActivityItem[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
