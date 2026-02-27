import { execSync } from "child_process";

const PATH_ENV = `/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:/home/ubuntu/.local/bin`;

export function openclawExec(cmd: string, timeout = 30000): string {
  try {
    return execSync(cmd, {
      timeout,
      encoding: "utf-8",
      env: { ...process.env, PATH: `${PATH_ENV}:${process.env.PATH || ""}` }
    }).trim();
  } catch {
    return "";
  }
}

// Read gateway auth token
export function getGatewayToken(): string {
  try {
    return process.env.OPENCLAW_GATEWAY_TOKEN || "";
  } catch {
    return "";
  }
}

// Call gateway API endpoint
export async function callGateway(path: string, body: Record<string, unknown>): Promise<unknown> {
  const token = getGatewayToken();
  const res = await fetch(`http://127.0.0.1:18789${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

// Spawn a session to generate AI content
export async function spawnSession(
  task: string,
  label: string = "session"
): Promise<{ sessionId?: string; status?: string }> {
  try {
    await callGateway('/api/sessions/spawn', {
      task,
      label,
      cleanup: "keep",
      timeout: 60000
    });
    return { sessionId: label, status: "started" };
  } catch {
    return { status: "error" };
  }
}