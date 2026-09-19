import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ALLOWED = new Set(["iw", "ip", "cat", "uci", "wifi", "ifup", "ifdown", "ping", "nslookup"]);

function validArg(value: string): boolean {
  return /^[A-Za-z0-9._:/-]+$/.test(value);
}

export class SafeCommandRunner {
  async run(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string; code: number }> {
    if (!ALLOWED.has(command)) throw new Error("Command is not allowlisted");
    if (args.some((arg) => !validArg(arg))) throw new Error("Invalid command argument");
    try {
      const result = await execFileAsync(command, args, { timeout: 8000, maxBuffer: 1024 * 1024 });
      return { stdout: result.stdout, stderr: result.stderr, code: 0 };
    } catch (error: any) {
      return {
        stdout: String(error?.stdout ?? ""),
        stderr: String(error?.stderr ?? error?.message ?? "command failed"),
        code: typeof error?.code === "number" ? error.code : 1,
      };
    }
  }
}
