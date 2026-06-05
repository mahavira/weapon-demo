import type { StatusApplyInfo } from '../../combat/StatusApplyInfo.ts';

export interface BurningTickResult {
    damageAmount: number;
    sourceWeaponId: string;
}

export interface BurningAdvanceResult {
    tickResults: BurningTickResult[];
    didExpire: boolean;
    expiredSourceWeaponId?: string;
}

interface ActiveBurningState {
    statusApplyInfo: StatusApplyInfo;
    remainingSeconds: number;
    tickAccumulatorSeconds: number;
    tickDamageAmount: number;
}

export class BurningStatusRuntime {
    private activeState: ActiveBurningState | null = null;

    public applyStatus(statusApplyInfo: StatusApplyInfo, baseWeaponDamage: number): boolean {
        const tickDamageAmount = baseWeaponDamage * statusApplyInfo.tickDamageRatio * statusApplyInfo.tickIntervalSeconds;
        const didStart = this.activeState === null;

        if (!this.activeState) {
            this.activeState = {
                statusApplyInfo,
                remainingSeconds: statusApplyInfo.durationSeconds,
                tickAccumulatorSeconds: 0,
                tickDamageAmount,
            };
            return didStart;
        }

        this.activeState.statusApplyInfo = statusApplyInfo;
        this.activeState.remainingSeconds = statusApplyInfo.durationSeconds;
        this.activeState.tickDamageAmount = tickDamageAmount;
        return didStart;
    }

    public advance(deltaSeconds: number): BurningAdvanceResult {
        if (!this.activeState || deltaSeconds <= 0) {
            return {
                tickResults: [],
                didExpire: false,
            };
        }

        const elapsedSeconds = Math.min(deltaSeconds, this.activeState.remainingSeconds);
        this.activeState.remainingSeconds = Math.max(0, this.activeState.remainingSeconds - deltaSeconds);
        this.activeState.tickAccumulatorSeconds += elapsedSeconds;

        const tickResults: BurningTickResult[] = [];
        while (this.activeState.tickAccumulatorSeconds + Number.EPSILON >= this.activeState.statusApplyInfo.tickIntervalSeconds) {
            this.activeState.tickAccumulatorSeconds -= this.activeState.statusApplyInfo.tickIntervalSeconds;
            tickResults.push({
                damageAmount: this.activeState.tickDamageAmount,
                sourceWeaponId: this.activeState.statusApplyInfo.sourceWeaponId,
            });
        }

        if (this.activeState.remainingSeconds > 0) {
            return {
                tickResults,
                didExpire: false,
            };
        }

        const expiredSourceWeaponId = this.activeState.statusApplyInfo.sourceWeaponId;
        this.activeState = null;
        return {
            tickResults,
            didExpire: true,
            expiredSourceWeaponId,
        };
    }

    public clear(): void {
        this.activeState = null;
    }

    public hasStatus(): boolean {
        return this.activeState !== null;
    }

    public getRemainingSeconds(): number {
        return this.activeState?.remainingSeconds ?? 0;
    }

    public getIntensity(): number {
        if (!this.activeState) {
            return 0;
        }

        const durationSeconds = Math.max(0.0001, this.activeState.statusApplyInfo.durationSeconds);
        const remainingRatio = this.activeState.remainingSeconds / durationSeconds;
        return 0.72 + remainingRatio * 0.28;
    }

    public getSourceWeaponId(): string {
        return this.activeState?.statusApplyInfo.sourceWeaponId ?? '';
    }
}
