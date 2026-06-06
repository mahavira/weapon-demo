export function pickRandomChainTarget<T>(candidates: readonly T[], randomValue: number = Math.random()): T | null {
    if (candidates.length === 0) {
        return null;
    }

    const safeRandomValue = Math.min(0.999999, Math.max(0, randomValue));
    const randomIndex = Math.floor(safeRandomValue * candidates.length);
    return candidates[randomIndex] ?? null;
}
