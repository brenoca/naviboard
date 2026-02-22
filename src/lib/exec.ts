import { execSync } from "child_process";

export function run(cmd: string, timeout = 15000): string {
  try {
    return execSync(cmd, { timeout, encoding: "utf-8", env: { ...process.env, PATH: `/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:/home/ubuntu/.local/bin:${process.env.PATH || ""}` } }).trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string };
    return err.stdout?.trim() || err.stderr?.trim() || "";
  }
}
