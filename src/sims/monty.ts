export const doors = [1, 2, 3] as const;
export type Door = (typeof doors)[number];

export const playRound = (prize: Door, pick: Door) => {
  // If the contestant picked the prize, the host opens the lower-numbered losing door.
  const opened = doors.find((door) => door !== prize && door !== pick)!;
  const swap = doors.find((door) => door !== opened && door !== pick)!;
  return { prize, pick, opened, swap, stayWins: pick === prize, switchWins: swap === prize };
};

export const simulateMonty = (seed: number, trials: number) => {
  let state = seed >>> 0 || 1;
  const draw = () => {
    // Xorshift32 visits all 2^32 - 1 nonzero states, evenly split among the three remainders.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return doors[(state >>> 0) % doors.length];
  };

  const rounds = Array.from({ length: trials }, () => playRound(draw(), draw()));
  const stayWins = rounds.filter((round) => round.stayWins).length;
  const switchWins = rounds.filter((round) => round.switchWins).length;
  return { rounds, stayWins, switchWins };
};
