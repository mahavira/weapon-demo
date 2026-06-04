import { Node } from 'cc';

export class NodeUtils {
    public static isValidNode(node: Node | null | undefined): node is Node {
        return !!node && node.isValid;
    }
}
