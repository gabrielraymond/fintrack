export interface InvestmentPLResult {
  profitLoss: number;
  percentage: number;
  isProfit: boolean;
}

export function calculateInvestmentPL(
  balance: number,
  investedAmount: number | null
): InvestmentPLResult | null {
  if (investedAmount === null || investedAmount <= 0) {
    return null;
  }
  const profitLoss = balance - investedAmount;
  const percentage = (profitLoss / investedAmount) * 100;
  return {
    profitLoss,
    percentage,
    isProfit: profitLoss >= 0,
  };
}
