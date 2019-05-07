import Args from "../src/lib/args";
import specs from "../src/lib/flags";

describe("Args", () => {

  it("should accept args which are specified by specs", () => {
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

  it("should accept --cmd with our specs", () => {
    const args = new Args(specs);
    args.add("cmd", "echo foo");
    args.add("cmd", "echo bar");
    expect(args.get("cmd").length).toBe(2);
    expect(args.get("cmd")[1]).toBe("echo bar");
  });

});
