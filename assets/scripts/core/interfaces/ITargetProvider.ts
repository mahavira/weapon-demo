import { Node } from 'cc';

export interface ITargetProvider {
    getPrimaryTarget(): Node | null;
    getTargetsWithinRange(center: Node, range: number): Node[];
}
