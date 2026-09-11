export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface SimplifiedTransaction {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string | null;
  amount: number;
}

export interface MemberBalanceSummary {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  netBalance: number; // positive = owed to user, negative = user owes
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

export interface ExpenseRecord {
  id: string;
  paidById: string;
  amount: number;
  splits: {
    userId: string;
    amountOwed: number;
  }[];
}

export interface SettlementRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Calculates net balances and raw pairwise debts for a group given its expenses and settlements.
 */
export function calculateGroupBalances(
  members: Participant[],
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[]
): {
  memberSummaries: MemberBalanceSummary[];
  pairwiseDebts: PairwiseDebt[];
  simplifiedDebts: SimplifiedTransaction[];
} {
  const memberMap = new Map<string, Participant>();
  for (const m of members) {
    memberMap.set(m.id, m);
  }

  // Track raw amounts in integer cents to eliminate floating-point drift
  const totalPaidCents = new Map<string, number>();
  const totalOwedCents = new Map<string, number>();
  // Pairwise map: key is `${userA}:${userB}` => amount userA owes userB in cents
  const rawPairwiseCents = new Map<string, number>();

  for (const m of members) {
    totalPaidCents.set(m.id, 0);
    totalOwedCents.set(m.id, 0);
  }

  // 1. Process Expenses
  for (const exp of expenses) {
    const payerId = exp.paidById;
    const paidCents = Math.round(exp.amount * 100);
    totalPaidCents.set(payerId, (totalPaidCents.get(payerId) || 0) + paidCents);

    for (const split of exp.splits) {
      const splitCents = Math.round(split.amountOwed * 100);
      totalOwedCents.set(split.userId, (totalOwedCents.get(split.userId) || 0) + splitCents);

      if (split.userId !== payerId) {
        // split.userId owes payerId
        const key = `${split.userId}:${payerId}`;
        rawPairwiseCents.set(key, (rawPairwiseCents.get(key) || 0) + splitCents);
      }
    }
  }

  // 2. Process Settlements
  for (const st of settlements) {
    const stCents = Math.round(st.amount * 100);
    // fromUser paid toUser, so fromUser's paid increases and toUser's owed increases (or vice versa)
    totalPaidCents.set(st.fromUserId, (totalPaidCents.get(st.fromUserId) || 0) + stCents);
    totalOwedCents.set(st.toUserId, (totalOwedCents.get(st.toUserId) || 0) + stCents);

    // Settlement directly reduces the debt from fromUser to toUser
    const forwardKey = `${st.fromUserId}:${st.toUserId}`;
    rawPairwiseCents.set(forwardKey, (rawPairwiseCents.get(forwardKey) || 0) - stCents);
  }

  // 3. Compute net balances for each member
  const netCentsMap = new Map<string, number>();
  const memberSummaries: MemberBalanceSummary[] = [];

  for (const m of members) {
    const paid = totalPaidCents.get(m.id) || 0;
    const owed = totalOwedCents.get(m.id) || 0;
    const net = paid - owed;
    netCentsMap.set(m.id, net);

    memberSummaries.push({
      userId: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      netBalance: Math.round(net) / 100,
      totalPaid: Math.round(paid) / 100,
      totalOwed: Math.round(owed) / 100,
    });
  }

  // 4. Compute simplified pairwise balances
  const pairwiseDebts: PairwiseDebt[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const u1 = members[i].id;
      const u2 = members[j].id;
      const pairKey = [u1, u2].sort().join(':');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const u1OwesU2 = rawPairwiseCents.get(`${u1}:${u2}`) || 0;
      const u2OwesU1 = rawPairwiseCents.get(`${u2}:${u1}`) || 0;
      const netDiff = u1OwesU2 - u2OwesU1;

      if (netDiff > 0) {
        // u1 owes u2
        pairwiseDebts.push({
          debtorId: u1,
          debtorName: memberMap.get(u1)?.name || 'Unknown',
          creditorId: u2,
          creditorName: memberMap.get(u2)?.name || 'Unknown',
          amount: Math.round(netDiff) / 100,
        });
      } else if (netDiff < 0) {
        // u2 owes u1
        pairwiseDebts.push({
          debtorId: u2,
          debtorName: memberMap.get(u2)?.name || 'Unknown',
          creditorId: u1,
          creditorName: memberMap.get(u1)?.name || 'Unknown',
          amount: Math.round(-netDiff) / 100,
        });
      }
    }
  }

  // 5. Compute simplified debt transactions using greedy min-cash-flow algorithm
  const simplifiedDebts = simplifyDebts(netCentsMap, memberMap);

  return {
    memberSummaries,
    pairwiseDebts,
    simplifiedDebts,
  };
}

/**
 * Greedy algorithm to simplify debt transactions to the minimum number of settlements.
 * Repeatedly pairs the maximum debtor with the maximum creditor.
 */
export function simplifyDebts(
  netCentsMap: Map<string, number>,
  memberMap: Map<string, Participant>
): SimplifiedTransaction[] {
  interface Debtor {
    userId: string;
    debtCents: number; // positive value
  }

  interface Creditor {
    userId: string;
    creditCents: number; // positive value
  }

  const debtors: Debtor[] = [];
  const creditors: Creditor[] = [];

  for (const [userId, net] of netCentsMap.entries()) {
    // Ignore near-zero drift (< 1 cent)
    if (net < -0.5) {
      debtors.push({ userId, debtCents: Math.round(-net) });
    } else if (net > 0.5) {
      creditors.push({ userId, creditCents: Math.round(net) });
    }
  }

  const transactions: SimplifiedTransaction[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending so the first element is the maximum
    debtors.sort((a, b) => b.debtCents - a.debtCents);
    creditors.sort((a, b) => b.creditCents - a.creditCents);

    const maxDebtor = debtors[0];
    const maxCreditor = creditors[0];

    const settleCents = Math.min(maxDebtor.debtCents, maxCreditor.creditCents);

    if (settleCents > 0) {
      const debtorInfo = memberMap.get(maxDebtor.userId);
      const creditorInfo = memberMap.get(maxCreditor.userId);

      transactions.push({
        fromUserId: maxDebtor.userId,
        fromUserName: debtorInfo?.name || 'Unknown',
        fromUserAvatar: debtorInfo?.avatarUrl,
        toUserId: maxCreditor.userId,
        toUserName: creditorInfo?.name || 'Unknown',
        toUserAvatar: creditorInfo?.avatarUrl,
        amount: settleCents / 100,
      });

      maxDebtor.debtCents -= settleCents;
      maxCreditor.creditCents -= settleCents;
    }

    if (maxDebtor.debtCents === 0) {
      debtors.shift();
    }
    if (maxCreditor.creditCents === 0) {
      creditors.shift();
    }
  }

  return transactions;
}

/**
 * Split distribution calculation for the 4 supported split modes.
 * Guaranteed to sum up to exactly totalAmount with no unallocated cents.
 */
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export interface SplitInput {
  userId: string;
  value?: number; // Exact amount, Percentage (0-100), or Share count (>=1)
}

export interface SplitResult {
  userId: string;
  amountOwed: number;
  shareCount?: number;
}

export function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  participants: SplitInput[]
): SplitResult[] {
  if (participants.length === 0) {
    throw new Error('At least one participant is required');
  }

  if (totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  const totalCents = Math.round(totalAmount * 100);

  switch (splitType) {
    case 'EQUAL': {
      const count = participants.length;
      const baseCents = Math.floor(totalCents / count);
      const remainder = totalCents % count;

      return participants.map((p, idx) => ({
        userId: p.userId,
        amountOwed: (baseCents + (idx < remainder ? 1 : 0)) / 100,
        shareCount: 1,
      }));
    }

    case 'EXACT': {
      let sumCents = 0;
      const results: SplitResult[] = [];

      for (const p of participants) {
        const val = p.value !== undefined ? p.value : 0;
        if (val < 0) {
          throw new Error('Split amount cannot be negative');
        }
        const cents = Math.round(val * 100);
        sumCents += cents;
        results.push({
          userId: p.userId,
          amountOwed: cents / 100,
        });
      }

      if (Math.abs(sumCents - totalCents) > 1) {
        throw new Error(
          `Exact amounts sum to ₹${sumCents / 100}, which does not match total ₹${totalAmount}`
        );
      }

      // Absorb 1-cent rounding difference on the first participant
      if (sumCents !== totalCents && results.length > 0) {
        const diff = totalCents - sumCents;
        results[0].amountOwed = Math.round(results[0].amountOwed * 100 + diff) / 100;
      }

      return results;
    }

    case 'PERCENTAGE': {
      let totalPct = 0;
      for (const p of participants) {
        const val = p.value !== undefined ? p.value : 0;
        if (val < 0) throw new Error('Percentage cannot be negative');
        totalPct += val;
      }

      if (Math.abs(totalPct - 100) > 0.05) {
        throw new Error(`Percentages sum to ${totalPct.toFixed(2)}%, must equal 100%`);
      }

      let allocatedCents = 0;
      const results: SplitResult[] = [];

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        const val = p.value || 0;
        const cents = Math.round((totalCents * val) / 100);
        allocatedCents += cents;
        results.push({
          userId: p.userId,
          amountOwed: cents / 100,
        });
      }

      // Distribute any rounding difference
      const diff = totalCents - allocatedCents;
      if (diff !== 0 && results.length > 0) {
        results[0].amountOwed = Math.round(results[0].amountOwed * 100 + diff) / 100;
      }

      return results;
    }

    case 'SHARES': {
      let totalShares = 0;
      for (const p of participants) {
        const shares = p.value !== undefined ? p.value : 1;
        if (shares <= 0) throw new Error('Shares must be at least 1');
        totalShares += shares;
      }

      if (totalShares === 0) {
        throw new Error('Total shares must be greater than zero');
      }

      let allocatedCents = 0;
      const results: SplitResult[] = [];

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        const shares = p.value !== undefined ? p.value : 1;
        const cents = Math.floor((totalCents * shares) / totalShares);
        allocatedCents += cents;
        results.push({
          userId: p.userId,
          amountOwed: cents / 100,
          shareCount: shares,
        });
      }

      // Distribute remainder cents to the highest share holders
      let remainder = totalCents - allocatedCents;
      let idx = 0;
      while (remainder > 0 && idx < results.length) {
        results[idx].amountOwed = Math.round(results[idx].amountOwed * 100 + 1) / 100;
        remainder--;
        idx++;
      }

      return results;
    }

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }
}
