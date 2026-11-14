import { describe, expect, it } from "vitest";
import spec from "../../episodes/which-circle-is-bigger.json";
import { brand } from "../brand/tokens";
import { circleGroups, coverDrop, diameter } from "./ebbinghausGeometry";

const { safe, video, crops } = brand;

describe("Ebbinghaus geometry", () => {
  it("keeps both targets and the moving gauge at the same diameter", () => {
    const [{ target: a }, { target: b }] = circleGroups(spec.illusion.radius);
    expect(a.radius).toBe(b.radius);
    expect(diameter(a)).toEqual(diameter(b));
    expect(diameter(a).bottom - diameter(a).top).toBe(2 * spec.illusion.radius);
  });

  it.each([64, spec.illusion.radius, 88])("keeps every disc separate and within both mobile crops at radius %i", (radius) => {
    const groups = circleGroups(radius);
    expect(groups[0].neighbours.every((circle) => circle.radius > radius)).toBe(true);
    expect(groups[1].neighbours.every((circle) => circle.radius < radius)).toBe(true);
    const circles = groups.flatMap(({ target, neighbours }) => [target, ...neighbours]);
    for (const [i, a] of circles.entries()) {
      expect(a.x - a.radius).toBeGreaterThanOrEqual(safe.left);
      expect(a.x + a.radius).toBeLessThanOrEqual(video.width - safe.right);
      expect(a.y - a.radius).toBeGreaterThanOrEqual(safe.top);
      expect(a.y + a.radius).toBeLessThanOrEqual(video.height - safe.bottom);
      expect(a.y - a.radius + coverDrop).toBeGreaterThanOrEqual(crops.square.top);
      expect(a.y + a.radius + coverDrop).toBeLessThanOrEqual(crops.square.bottom);
      for (const b of circles.slice(i + 1)) {
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.radius + b.radius);
      }
    }
  });
});
