import type { StatusApplyInfo } from './StatusApplyInfo';

export interface StatusApplyReceiver {
    applyStatus(statusApplyInfo: StatusApplyInfo): void;
}

export interface StatusApplyTargetNode {
    getComponent(componentType: unknown): StatusApplyReceiver | null;
}

export function forwardStatusApplyList(
    targetNode: StatusApplyTargetNode,
    statusApplyList?: readonly StatusApplyInfo[],
    statusReceiverType?: unknown,
): void {
    if (!statusApplyList?.length) {
        return;
    }

    const statusApplyReceiver = targetNode.getComponent(statusReceiverType ?? null);
    if (!statusApplyReceiver || typeof statusApplyReceiver.applyStatus !== 'function') {
        return;
    }

    for (const statusApplyInfo of statusApplyList) {
        statusApplyReceiver.applyStatus(statusApplyInfo);
    }
}
