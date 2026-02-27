import { NextRequest, NextResponse } from "next/server";
import { openclawExec } from "@/lib/openclaw";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

interface ExecuteRequest {
  id: number;
  name: string;
  category: string;
  status: string;
  priority: string;
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ExecuteRequest = await req.json();

    // Update task status to in_progress and set execution_run_id
    const result = db.prepare(
      "UPDATE tasks SET status = 'in_progress', execution_run_id = ? WHERE id = ?"
    ).run(`exec-${Date.now()}-${body.id}`, body.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Build prompt for sub-agent
    const taskContext = `
Task: ${body.name}
Category: ${body.category}
Priority: ${body.priority}
Current Notes: ${body.notes}
`;

    const executePrompt = `${taskContext}

You are an AI assistant executing this task. Please complete it using available tools and resources. When done, update the task status to:
- "done" if completed successfully
- "blocked" if you encountered a blocker or can't proceed

To update the task, use the dashboard API with this authentication:

UPDATE API for localhost calls:
POST http://127.0.0.1:3333/api/tasks

Update Format:
{
  "id": <task_id>,
  "status": "done" or "blocked",
  "notes": "<your execution notes here>"
}

Example curl command:
curl http://127.0.0.1:3333/api/tasks -X PUT \
  -H "Content-Type: application/json" \
  -b "navi_auth=<your_dashboard_secret>" \
  -d '{"id": <task_id>, "status": "done", "notes": "Task completed successfully"}'

Important: The curl command must include the navi_auth cookie. If you have access to the environment variable DASHBOARD_SECRET, add it to the cookie.

Return your final report, then call the update api.`;

    // Spawn a session to execute the task
    const sessionLabel = `exec-${body.id}-${Date.now()}`;
    openclawExec(
      `timeout 300 openclaw sessions send --label "${sessionLabel}" --message "${encodeURIComponent(executePrompt)}" --timeout 300`,
      320000
    );

    return NextResponse.json({
      runId: `exec-${Date.now()}`,
      status: "running",
      message: "Task execution started"
    });

  } catch (error) {
    console.error("Execute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}