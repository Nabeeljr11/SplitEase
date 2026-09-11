import { describe, it, expect } from 'vitest';
import {
  calculateGroupBalances,
  simplifyDebts,
  calculateSplits,
  Participant,
  ExpenseRecord,
  SettlementRecord,
} from '../src/modules/balances/debtSimplifier';

describe('Debt Simplification & Balance Engine', () => {
  const alice: Participant = { id: 'user-1', name: 'Alice' };
  const bob: Participant = { id: 'user-2', name: 'Bob' };
  const charlie: Participant = { id: 'user-3', name: 'Charlie' };
  const david: Participant = { id: 'user-4', name: 'David' };

  describe('calculateGroupBalances & simplifyDebts', () => {
    it('handles simple 2-person split', () => {
      const members = [alice, bob];
      const expenses: ExpenseRecord[] = [
        {
          id: 'exp-1',
          paidById: alice.id,
          amount: 100,
          splits: [
            { userId: alice.id, amountOwed: 50 },
            { userId: bob.id, amountOwed: 50 },
          ],
        },
      ];

      const result = calculateGroupBalances(members, expenses, []);

      expect(result.memberSummaries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: alice.id, netBalance: 50, totalPaid: 100, totalOwed: 50 }),
          expect.objectContaining({ userId: bob.id, netBalance: -50, totalPaid: 0, totalOwed: 50 }),
        ])
      );

      expect(result.simplifiedDebts).toHaveLength(1);
      expect(result.simplifiedDebts[0]).toEqual({
        fromUserId: bob.id,
        fromUserName: 'Bob',
        fromUserAvatar: undefined,
        toUserId: alice.id,
        toUserName: 'Alice',
        toUserAvatar: undefined,
        amount: 50,
      });
    });

    it('resolves 3-person circular debts to zero transactions', () => {
      const members = [alice, bob, charlie];
      // Alice pays 60 for Alice & Bob (Bob owes Alice 30)
      // Bob pays 60 for Bob & Charlie (Charlie owes Bob 30)
      // Charlie pays 60 for Charlie & Alice (Alice owes Charlie 30)
      const expenses: ExpenseRecord[] = [
        {
          id: 'exp-1',
          paidById: alice.id,
          amount: 60,
          splits: [
            { userId: alice.id, amountOwed: 30 },
            { userId: bob.id, amountOwed: 30 },
          ],
        },
        {
          id: 'exp-2',
          paidById: bob.id,
          amount: 60,
          splits: [
            { userId: bob.id, amountOwed: 30 },
            { userId: charlie.id, amountOwed: 30 },
          ],
        },
        {
          id: 'exp-3',
          paidById: charlie.id,
          amount: 60,
          splits: [
            { userId: charlie.id, amountOwed: 30 },
            { userId: alice.id, amountOwed: 30 },
          ],
        },
      ];

      const result = calculateGroupBalances(members, expenses, []);

      // Everyone paid 60 and owes 60 -> net 0
      for (const summary of result.memberSummaries) {
        expect(summary.netBalance).toBe(0);
      }

      // Simplified debts should be completely 0 transactions!
      expect(result.simplifiedDebts).toHaveLength(0);
    });

    it('minimizes transactions in multi-party trip scenario', () => {
      // Alice pays 300 for Alice, Bob, Charlie (100 each)
      // Bob pays 150 for Bob, Charlie, David (50 each)
      // Charlie pays 80 for Charlie & David (40 each)
      const members = [alice, bob, charlie, david];
      const expenses: ExpenseRecord[] = [
        {
          id: 'exp-1',
          paidById: alice.id,
          amount: 300,
          splits: [
            { userId: alice.id, amountOwed: 100 },
            { userId: bob.id, amountOwed: 100 },
            { userId: charlie.id, amountOwed: 100 },
          ],
        },
        {
          id: 'exp-2',
          paidById: bob.id,
          amount: 150,
          splits: [
            { userId: bob.id, amountOwed: 50 },
            { userId: charlie.id, amountOwed: 50 },
            { userId: david.id, amountOwed: 50 },
          ],
        },
        {
          id: 'exp-3',
          paidById: charlie.id,
          amount: 80,
          splits: [
            { userId: charlie.id, amountOwed: 40 },
            { userId: david.id, amountOwed: 40 },
          ],
        },
      ];

      const result = calculateGroupBalances(members, expenses, []);

      // Net:
      // Alice: paid 300, owed 100 -> +200
      // Bob: paid 150, owed 150 -> 0
      // Charlie: paid 80, owed 190 -> -110
      // David: paid 0, owed 90 -> -90
      // Sum of net balances = 200 + 0 - 110 - 90 = 0.

      const aliceSummary = result.memberSummaries.find((s) => s.userId === alice.id);
      const bobSummary = result.memberSummaries.find((s) => s.userId === bob.id);
      const charlieSummary = result.memberSummaries.find((s) => s.userId === charlie.id);
      const davidSummary = result.memberSummaries.find((s) => s.userId === david.id);

      expect(aliceSummary?.netBalance).toBe(200);
      expect(bobSummary?.netBalance).toBe(0);
      expect(charlieSummary?.netBalance).toBe(-110);
      expect(davidSummary?.netBalance).toBe(-90);

      // Without simplification, multiple transactions would occur.
      // With greedy simplification: Charlie owes 110, David owes 90; Alice is owed 200.
      // Should result in exactly 2 transactions directly to Alice!
      expect(result.simplifiedDebts).toHaveLength(2);
      expect(result.simplifiedDebts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fromUserId: charlie.id, toUserId: alice.id, amount: 110 }),
          expect.objectContaining({ fromUserId: david.id, toUserId: alice.id, amount: 90 }),
        ])
      );
    });

    it('correctly incorporates settlement records', () => {
      const members = [alice, bob];
      const expenses: ExpenseRecord[] = [
        {
          id: 'exp-1',
          paidById: alice.id,
          amount: 100,
          splits: [
            { userId: alice.id, amountOwed: 50 },
            { userId: bob.id, amountOwed: 50 },
          ],
        },
      ];

      // Bob settles 30 with Alice
      const settlements: SettlementRecord[] = [
        {
          id: 'settle-1',
          fromUserId: bob.id,
          toUserId: alice.id,
          amount: 30,
        },
      ];

      const result = calculateGroupBalances(members, expenses, settlements);

      const aliceSummary = result.memberSummaries.find((s) => s.userId === alice.id);
      const bobSummary = result.memberSummaries.find((s) => s.userId === bob.id);

      expect(aliceSummary?.netBalance).toBe(20);
      expect(bobSummary?.netBalance).toBe(-20);

      expect(result.simplifiedDebts).toHaveLength(1);
      expect(result.simplifiedDebts[0]).toEqual(
        expect.objectContaining({ fromUserId: bob.id, toUserId: alice.id, amount: 20 })
      );
    });
  });

  describe('calculateSplits', () => {
    it('splits equally with exact cents conservation (no lost remainder)', () => {
      const participants = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];
      const splits = calculateSplits(100, 'EQUAL', participants);

      expect(splits).toHaveLength(3);
      const totalAllocated = splits.reduce((sum, s) => sum + s.amountOwed, 0);
      expect(totalAllocated).toBeCloseTo(100, 2);

      // 100 / 3 = 33.33 with 1 cent remainder allocated to the first participant
      expect(splits[0].amountOwed).toBe(33.34);
      expect(splits[1].amountOwed).toBe(33.33);
      expect(splits[2].amountOwed).toBe(33.33);
    });

    it('splits by exact amounts and rejects invalid sums', () => {
      const participants = [
        { userId: 'u1', value: 40 },
        { userId: 'u2', value: 60 },
      ];
      const splits = calculateSplits(100, 'EXACT', participants);
      expect(splits[0].amountOwed).toBe(40);
      expect(splits[1].amountOwed).toBe(60);

      expect(() => {
        calculateSplits(100, 'EXACT', [
          { userId: 'u1', value: 40 },
          { userId: 'u2', value: 50 }, // sums to 90 != 100
        ]);
      }).toThrow(/does not match total/);
    });

    it('splits by percentage and allocates rounding cents', () => {
      const participants = [
        { userId: 'u1', value: 50 },
        { userId: 'u2', value: 30 },
        { userId: 'u3', value: 20 },
      ];
      const splits = calculateSplits(200, 'PERCENTAGE', participants);
      expect(splits[0].amountOwed).toBe(100);
      expect(splits[1].amountOwed).toBe(60);
      expect(splits[2].amountOwed).toBe(40);

      expect(() => {
        calculateSplits(100, 'PERCENTAGE', [
          { userId: 'u1', value: 50 },
          { userId: 'u2', value: 40 }, // sums to 90% != 100%
        ]);
      }).toThrow(/must equal 100%/);
    });

    it('splits by shares proportionally', () => {
      const participants = [
        { userId: 'u1', value: 3 }, // 3 shares
        { userId: 'u2', value: 1 }, // 1 share
      ];
      // Total 4 shares. 100 / 4 = 25 per share.
      const splits = calculateSplits(100, 'SHARES', participants);
      expect(splits[0].amountOwed).toBe(75);
      expect(splits[1].amountOwed).toBe(25);
    });
  });
});
