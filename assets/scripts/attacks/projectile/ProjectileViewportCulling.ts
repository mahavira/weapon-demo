export type RectLike = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type VisibleAreaProvider = {
    getVisibleOrigin(): { x: number; y: number };
    getVisibleSize(): { width: number; height: number };
};

export function isRectFullyOutsideVisibleArea(bounds: RectLike, visibleArea: RectLike): boolean {
    const boundsRight = bounds.x + bounds.width;
    const boundsTop = bounds.y + bounds.height;
    const visibleRight = visibleArea.x + visibleArea.width;
    const visibleTop = visibleArea.y + visibleArea.height;

    return boundsRight <= visibleArea.x
        || bounds.x >= visibleRight
        || boundsTop <= visibleArea.y
        || bounds.y >= visibleTop;
}

export function isNodeFullyOutsideVisibleArea(boundsProvider: { getBoundingBoxToWorld(): RectLike } | null, visibleArea: RectLike): boolean {
    if (!boundsProvider) {
        return false;
    }

    return isRectFullyOutsideVisibleArea(boundsProvider.getBoundingBoxToWorld(), visibleArea);
}

export function getVisibleAreaRect(visibleAreaProvider: VisibleAreaProvider): RectLike {
    const visibleOrigin = visibleAreaProvider.getVisibleOrigin();
    const visibleSize = visibleAreaProvider.getVisibleSize();

    return {
        x: visibleOrigin.x,
        y: visibleOrigin.y,
        width: visibleSize.width,
        height: visibleSize.height,
    };
}
