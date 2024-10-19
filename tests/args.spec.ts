import { Args } from "../src/lib/args";
import { specs } from "../src/lib/specs";

describe("Args", () => {
  const examplespec = () => ({
    add: (val: string[], flag: unknown, next: string) => val.push(next),
    flags: ["-f", "--foo"],
    name: "foo",
    value: [],
  });

  it("should accept args which are specified by specs", () => {
    const args = new Args([examplespec()]);
    args.add("foo", "100");
    args.add("xxx", "200");
    expect(args.get("foo")[0]).toBe("100");
    expect(args.get("xxx")[0]).toBeUndefined();
  });

  it("should accept --cmd with our specs", () => {
    const args = new Args(specs);
    args.add("cmd", "echo foo");
    args.add("cmd", "echo bar");
    expect(args.get("cmd").length).toBe(2);
    expect(args.get("cmd")[1]).toBe("echo bar");
  });

  describe("parse", () => {
    it("should parse strings to args", () => {
      const args = new Args([examplespec()]);
      args.parse(["/bin/node", "foobaa", "-f", "hogera"]);
      expect(args.get("foo")).toEqual(["hogera"]);
    });
  });

});
