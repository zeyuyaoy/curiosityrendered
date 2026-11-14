import React from "react";
import { useEpisode } from "../episode/context";
import { MazeRace } from "../sims/maze/MazeRace";

export const Simulation: React.FC = () => {
  const { maze } = useEpisode();
  return maze ? <MazeRace grid={maze.grid} results={maze.results} /> : null;
};
