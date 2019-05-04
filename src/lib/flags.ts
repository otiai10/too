import { Spec } from "./args";

const specs: Spec[] = [
  {
    add: (val: any, flag: any, next: any) => { val.push(next); },
    flags: ["-c", "--cmd"],
    name: "cmd",
    value: [],
  },
];

export default specs;
