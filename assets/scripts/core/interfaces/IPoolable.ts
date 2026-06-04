export interface IPoolable {
    onGetFromPool(): void;
    onReturnToPool(): void;
}
