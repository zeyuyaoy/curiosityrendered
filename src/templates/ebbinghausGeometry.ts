import { brand } from "../brand/tokens";

export const circleGroups = (radius: number) =>
  [
    { label: "A", x: 350, count: 6, orbit: radius * 2.4, neighbourRadius: radius * 1.13 },
    { label: "B", x: 772, count: 10, orbit: radius * 1.48, neighbourRadius: radius * 0.32 },
  ].map(({ label, x, count, orbit, neighbourRadius }) => ({
    label,
    target: { x, y: 900, radius },
    neighbours: Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      return { x: x + Math.cos(angle) * orbit, y: 900 + Math.sin(angle) * orbit, radius: neighbourRadius };
    }),
  }));

export type Circle = ReturnType<typeof circleGroups>[number]["target"];

export const diameter = ({ y, radius }: Circle) => ({
  top: y - radius,
  bottom: y + radius,
  length: 2 * radius,
});

export const coverDrop = brand.crops.square.top - brand.layout.headlineTop - 80;
