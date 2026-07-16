/**
 * Level configuration — multiplier komisi & threshold auto-level.
 * Dipakai oleh server action (lib/actions/tasks-admin.ts) dan bisa juga
 * diimpor dari client component untuk menampilkan label/rate.
 */

export const LEVEL_MULTIPLIER = {
  classic: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 1.75,
  diamond: 2.0,
  premier: 2.5,
} as const;

export type Level = keyof typeof LEVEL_MULTIPLIER;

export const TASK_LEVEL_RANK: Record<Level, number> = {
  classic: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  diamond: 4,
  premier: 5,
};

export const LEVEL_LABEL: Record<Level, string> = {
  classic: "Classic",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  premier: "Premier",
};

export const LEVEL_RATE_PERCENT: Record<Level, number> = {
  classic: 20,
  silver: 25,
  gold: 30,
  platinum: 35,
  diamond: 40,
  premier: 50,
};

/**
 * Auto-level berdasarkan jumlah tugas selesai kumulatif member.
 * Hanya naik; tidak auto-turun.
 */
export function levelFromCompletedTasks(count: number): Level {
  if (count >= 100) return "premier";
  if (count >= 50) return "diamond";
  if (count >= 30) return "platinum";
  if (count >= 15) return "gold";
  if (count >= 5) return "silver";
  return "classic";
}
