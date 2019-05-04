import { Spec } from "./args";

const specs: Spec[] = [
  {
    name: 'cmd',
    flags: ['-c', '--cmd'],
    value: [],
    add: (val: any, flag: any, next: any) => { val.push(next); },
  },
];

export default specs;
