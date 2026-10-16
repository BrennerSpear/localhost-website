// Track list as of 2026-10-15. Groups per dmarz: Sovereign Applications, Sovereign Capabilities, plus a small physical track.
export const GROUPS = [
  { name: "Sovereign Applications", tracks: [
    { id: "memory", name: "Own Your Memory", line: "What your AI knows about you lives with you." },
    { id: "data", name: "Own Your Data", line: "Private by construction: on-device, encrypted, or inside confidential compute." },
    { id: "wild", name: "Own Your ___", line: "Fill in the blank: identity, inbox, feed, money, compute." },
  ]},
  { name: "Sovereign Capabilities", tracks: [
    { id: "harness", name: "Own Your Harness", line: "The agent loop, the tools, the skills: the code wrapped around the model." },
    { id: "weights", name: "Open Weights", line: "Build on open models: run them, tune them, distill them." },
    { id: "swarms", name: "Agent Swarms", line: "Many agents, one goal, and every one of them answers to you." },
    { id: "formal", name: "Formal Verification", line: "Agents whose behaviour you can prove, not just hope for." },
  ]},
  { name: "Off-Grid", tracks: [
    { id: "hardware", name: "Own Your Hardware", line: "AI on a box you can touch: edge devices, robots, sensors, radios." },
  ]},
];
export const TRACKS = GROUPS.flatMap((g) => g.tracks.map((t) => ({ ...t, group: g.name })));

export const EVENT = {
  name: "LOCALHOST",
  sub: "New York's Sovereign AI Hackathon",
  line1: "No one should own your AI except for you.",
  line2: "Come hack on open weights, open harnesses, and open hardware and accelerate the future.",
  when: "Nov 7–8, 2026",
  where: "The School, New York",
  size: "100 hackers + speakers",
};
