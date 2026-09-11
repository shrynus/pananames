export function parseMoney(value: string): number {
  const normalized = value.replace(/[^0-9.-]/g, '');
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error(`Cannot parse money value: "${value}"`);
  }

  return amount;
}

export function lastMoneyValue(value: string): number {
  const matches = value.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!matches?.length) {
    throw new Error(`No USD price found in: "${value}"`);
  }

  return parseMoney(matches.at(-1)!);
}
