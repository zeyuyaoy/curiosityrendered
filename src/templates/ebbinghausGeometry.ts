export const circleGroups = (radius: number, cover = false) =>
  [
    { label: "A", x: 360, y: cover ? 1070 : 800, count: 6, orbit: radius * 2.4, neighbourRadius: radius * 1.13 },
    { label: "B", x: 788, y: cover ? 1070 : 1088, count: 10, orbit: radius * 1.48, neighbourRadius: radius * 0.32 },
  ].map(({ label, x, y, count, orbit, neighbourRadius }) => ({
    label,
    target: { x, y, radius },
    neighbours: Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      return { x: x + Math.cos(angle) * orbit, y: y + Math.sin(angle) * orbit, radius: neighbourRadius };
    }),
  }));

export type Circle = ReturnType<typeof circleGroups>[number]["target"];

export const diameter = ({ y, radius }: Circle) => ({
  top: y - radius,
  bottom: y + radius,
  length: 2 * radius,
});
