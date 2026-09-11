import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CategoryIcon } from '../common/CategoryIcon';

interface CategorySpendingItem {
  category: string;
  amount: number;
}

interface CategoryChartProps {
  data: CategorySpendingItem[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const totalSpent = data.reduce((acc, curr) => acc + curr.amount, 0);

  // Format category labels for display
  const chartData = data
    .filter((d) => d.amount > 0)
    .map((item) => ({
      name: item.category.charAt(0) + item.category.slice(1).toLowerCase(),
      category: item.category,
      amount: item.amount,
    }));

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 transition-all duration-150">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Spending by Category
          </h3>
          <p className="text-xs text-secondaryText mt-0.5">Last 30 days breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-secondaryText block">Total Spent</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border-light dark:border-border-dark rounded-2xl">
          <p className="text-xs text-secondaryText">No expense records in the last 30 days</p>
        </div>
      ) : (
        <>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#737373' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5E5', strokeWidth: 1 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#737373' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 rounded-xl text-xs shadow-lg font-medium">
                          <span>{item.name}: </span>
                          <span className="font-bold">₹{item.amount.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(150, 150, 150, 0.08)' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      className="fill-neutral-900 dark:fill-neutral-200 transition-colors"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown pill list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            {chartData.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-border-light/60 dark:border-border-dark/60"
              >
                <CategoryIcon category={item.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 truncate block">
                    {item.name}
                  </span>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    ₹{item.amount.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
