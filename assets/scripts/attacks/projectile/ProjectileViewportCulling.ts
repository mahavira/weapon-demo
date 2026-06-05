export type RectLike = {
    x: number;
    y: number;
    width: number;
    height: number;
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
