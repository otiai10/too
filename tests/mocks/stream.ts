import { Duplex } from "stream";

export default class DummyStream extends Duplex {
  public _write(chunk: Buffer | string | any, encoding: string, done: () => void) {
    done();
  }
  public _read(size: number) {
    this.push("echo 2000\n\n");
  }
}
