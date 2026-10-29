import { Object3D, Vector3 } from "three";

export const LAYOUTS = ["Table", "Sphere", "Helix", "Grid"] as const;
export type Layout = (typeof LAYOUTS)[number];

export function createLayoutTargets(count: number): Record<Layout, Object3D[]> {
  const targets: Record<Layout, Object3D[]> = { Table: [], Sphere: [], Helix: [], Grid: [] };
  const lookAt = new Vector3();
  for (let index = 0; index < count; index++) {
    const table = new Object3D();
    table.position.set(
      (index % 20 - (Math.min(20, count) - 1) / 2) * 170,
      ((Math.ceil(count / 20) - 1) / 2 - Math.floor(index / 20)) * 235,
      0,
    );
    targets.Table.push(table);

    const sphere = new Object3D();
    const phi = Math.acos(-1 + 2 * index / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    sphere.position.setFromSphericalCoords(1100, phi, theta);
    sphere.lookAt(lookAt.copy(sphere.position).multiplyScalar(2));
    targets.Sphere.push(sphere);

    const helix = new Object3D();
    const level = Math.floor(index / 2);
    const angle = level * 0.22 + (index % 2) * Math.PI;
    helix.position.setFromCylindricalCoords(1000, angle, ((Math.ceil(count / 2) - 1) / 2 - level) * 24);
    helix.lookAt(lookAt.set(helix.position.x * 2, helix.position.y, helix.position.z * 2));
    targets.Helix.push(helix);

    const grid = new Object3D();
    grid.position.set(
      (index % 5 - 2) * 400,
      (1.5 - Math.floor(index / 5) % 4) * 300,
      (Math.floor(index / 20) - (Math.ceil(count / 20) - 1) / 2) * 500,
    );
    targets.Grid.push(grid);
  }
  return targets;
}
