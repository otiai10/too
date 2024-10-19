import { Spec } from "./args";

export const specs: Spec[] = [
  {
    add: (val: string[], flag: unknown, next: string) => val.push(next),
    flags: ["-c", "--cmd"],
    name: "cmd",
    value: [],
  },
];
