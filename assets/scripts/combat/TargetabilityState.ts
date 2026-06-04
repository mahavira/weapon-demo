import { DamageChannel } from '../core/types/DamageChannel.ts';

const ALL_DAMAGE_CHANNELS = Object.values(DamageChannel);

export class TargetabilityState {
    private isTargetableState: boolean = true;
    private allowedChannels: Set<DamageChannel> = new Set(ALL_DAMAGE_CHANNELS);

    public canBeTargeted(): boolean {
        return this.isTargetableState;
    }

    public setTargetable(isTargetable: boolean): void {
        this.isTargetableState = isTargetable;
    }

    public canBeHitBy(channel: DamageChannel): boolean {
        return this.allowedChannels.has(channel);
    }

    public setDamageChannelAllowed(channel: DamageChannel, isAllowed: boolean): void {
        if (isAllowed) {
            this.allowedChannels.add(channel);
            return;
        }

        this.allowedChannels.delete(channel);
    }

    public applyNormalCombatProfile(): void {
        this.isTargetableState = true;
        this.allowedChannels = new Set(ALL_DAMAGE_CHANNELS);
    }

    public applyAreaOnlyCombatProfile(): void {
        this.isTargetableState = false;
        this.allowedChannels = new Set([DamageChannel.Area]);
    }
}
