import { Vec3 } from 'cc';

export interface IPath {
    getPosition(t: number): Vec3;
}
