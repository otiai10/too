
const specs = [
  {
    name: 'cmd',
    flags: ['-c', '--cmd'],
    value: [],
    add: (val, flag, next) => { val.push(next); },
  },
];

module.exports = specs;
