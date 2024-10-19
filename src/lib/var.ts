import * as child_process from "child_process";

export class VarGenerator {
  private __value?: string;
  constructor(
    private generate: string,
    private collect: "stdout" | "stderr" = "stdout",
  ) { }
  async value(): Promise<string> {
    if (this.__value) { return this.__value; }
    return new Promise((resolve, reject) => {
      child_process.exec(this.generate, (err, stdout, stderr) => {
        if (err) { return reject(err); }
        this.__value = (this.collect === "stdout" ? stdout : stderr).trim();
        resolve(this.__value);
      });
    })
  }
}
