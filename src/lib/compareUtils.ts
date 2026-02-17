import { CompareData } from "@/components/ScoreCard";

export function calcCompare(
  current: number,
  previous: number | undefined | null,
  label: string
): CompareData | undefined {
  if (previous == null || previous === 0) return undefined;
  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  return { percentChange, label };
}
