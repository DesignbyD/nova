/** Integer-cent helpers so sums never drift (0.1 + 0.2). Used for display totals only. */
export const toCents = (amount: number): number => Math.round(amount * 100);
export const fromCents = (cents: number): number => cents / 100;

export function sumLines(lines: Array<{ price: number; quantity: number }>): number {
  return fromCents(lines.reduce((total, line) => total + toCents(line.price) * line.quantity, 0));
}
