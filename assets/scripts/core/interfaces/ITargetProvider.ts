import { Node } from 'cc';

export interface ITargetProvider {
    getTarget(): Node | null;
    getTargetsInRange(center: Node, range: number): Node[];
}
