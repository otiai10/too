import { Duplex } from "stream";

export default class Stream extends Duplex implements NodeJS.WritableStream, NodeJS.ReadStream {
  public _write(chunk: Buffer | string | any, encoding: string, done: () => void) {
    done();
  }
  public _read(size: number) {
    this.push("echo 2000\n\n");
  }
}
