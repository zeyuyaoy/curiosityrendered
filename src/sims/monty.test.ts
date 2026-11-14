import { describe, expect, it } from "vitest";
import { playRound, simulateMonty } from "./monty";

describe("Monty Hall", () => {
  it("matches every equally likely prize/pick outcome and gives exact 1/3 and 2/3 odds", () => {
    const cases = [
      // Prize, initial pick, host reveal, offered door
      [1, 1, 2, 3],
      [1, 2, 3, 1],
      [1, 3, 2, 1],
      [2, 1, 3, 2],
      [2, 2, 1, 3],
      [2, 3, 1, 2],
      [3, 1, 2, 3],
      [3, 2, 1, 3],
      [3, 3, 1, 2],
    ] as const;

    const outcomes = cases.map(([prize, pick, opened, swap]) => {
      const stayWins = pick === prize;
      const switchWins = swap === prize;
      expect(playRound(prize, pick)).toEqual({ prize, pick, opened, swap, stayWins, switchWins });
      return { stayWins, switchWins };
    });

    expect(outcomes.filter((round) => round.stayWins).length / cases.length).toBe(1 / 3);
    expect(outcomes.filter((round) => round.switchWins).length / cases.length).toBe(2 / 3);
  });

  it("replays the predetermined sample faithfully and lets other seeds draw different samples", () => {
    const sample = simulateMonty(20261119, 120);
    expect(sample.rounds).toHaveLength(120);
    expect(sample.stayWins).toBe(34);
    expect(sample.switchWins).toBe(86);
    expect(sample.rounds.filter(({ prize, pick }) => prize === pick)).toHaveLength(sample.stayWins);
    expect(sample.rounds.filter(({ prize, swap }) => prize === swap)).toHaveLength(sample.switchWins);
    expect(simulateMonty(20261119, 5).rounds).toEqual(sample.rounds.slice(0, 5));
    expect(simulateMonty(20261119, 120)).toEqual(sample);
    expect(simulateMonty(20261120, 120).rounds).not.toEqual(sample.rounds);
  });
});
