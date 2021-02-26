import { Duplex } from "stream";

export default class DummyStream extends Duplex {
  public _write(chunk: Buffer | string | unknown, encoding: string, done: () => void): void {
    done();
  }
  public _read(/* size: number */): void {
    this.push("echo 2000\n\n");
  }
}
