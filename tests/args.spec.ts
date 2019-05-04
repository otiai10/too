import Args from "../src/lib/args";

it("Args", () => {
  const args = new Args([
    {
      add: (val: any, flag: string, next: string) => { val.push(next); },
      flags: ["-f", "--foo"],
      name: "foo",
      value: [],
    },
  ]);
  args.add("foo", 100);
  args.add("xxx", 200);
  expect(args.get("foo")[0]).toBe(100);
  expect(args.get("xxx")[0]).toBeUndefined();
});
