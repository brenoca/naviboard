export interface WorkflowNode {
  id: string;
  title: string;
  type: 'trigger' | 'condition' | 'action' | 'notification' | 'router' | 'llm';
  icon: string;
  tech: string;
  description: string;
  schedule?: string;
  script?: string;
  status?: 'active' | 'disabled' | 'error';
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const workflows: Workflow[] = [
  {
    id: 'email-monitor',
    name: 'Email Monitor & Handler',
    description: 'Monitors Gmail inbox and automatically processes, categorizes, and responds to emails using LLM agents.',
    enabled: true,
    nodes: [
      { id: 'em-1', title: 'Check Inbox', type: 'trigger', icon: '⏰', tech: 'Python script', description: 'Checks Gmail IMAP for unread emails', schedule: 'Every 1 min', script: 'email_watcher.py', status: 'active' },
      { id: 'em-2', title: 'Unread Emails?', type: 'condition', icon: '🔀', tech: 'Condition', description: 'If unread > 0, trigger LLM handler', status: 'active' },
      { id: 'em-3', title: 'Process Emails', type: 'llm', icon: '🤖', tech: 'OpenClaw cron (Gemini Flash)', description: 'Reads, categorizes, and handles each email', status: 'active' },
      { id: 'em-4', title: 'Email Category', type: 'router', icon: '🔀', tech: 'Router', description: 'Route by sender/category', status: 'active' },
      { id: 'em-5a', title: 'Analyze & Reply', type: 'action', icon: '📧', tech: 'Python script + LLM', description: 'Read, analyze forwarded content, reply, archive', status: 'active' },
      { id: 'em-5b', title: 'Reply Autonomously', type: 'action', icon: '📧', tech: 'Python script + LLM', description: 'Reply warmly, archive, notify Telegram', status: 'active' },
      { id: 'em-5c', title: 'Archive', type: 'action', icon: '📁', tech: 'Python script', description: 'Archive automated/noreply emails', status: 'active' },
      { id: 'em-5d', title: 'Notify for Approval', type: 'notification', icon: '📱', tech: 'Telegram API', description: 'Draft reply, send to Breno for approval', status: 'active' },
      { id: 'em-6', title: 'Telegram Notification', type: 'notification', icon: '📱', tech: 'Telegram Bot API', description: 'Send summary to Breno on Telegram', status: 'active' },
      { id: 'em-end', title: 'End', type: 'action', icon: '⏹️', tech: '', description: 'No action needed', status: 'active' },
    ],
    edges: [
      { from: 'em-1', to: 'em-2' },
      { from: 'em-2', to: 'em-3', label: 'Yes' },
      { from: 'em-2', to: 'em-end', label: 'No' },
      { from: 'em-3', to: 'em-4' },
      { from: 'em-4', to: 'em-5a', label: 'Breno' },
      { from: 'em-4', to: 'em-5b', label: 'Tudor' },
      { from: 'em-4', to: 'em-5c', label: 'Automated' },
      { from: 'em-4', to: 'em-5d', label: 'Other' },
      { from: 'em-5a', to: 'em-6' },
      { from: 'em-5b', to: 'em-6' },
      { from: 'em-5d', to: 'em-6' },
    ],
  },
  {
    id: 'stale-inbox',
    name: 'Stale Inbox Checker',
    description: 'Monitors for emails that have been sitting in the inbox unprocessed for too long.',
    enabled: true,
    nodes: [
      { id: 'si-1', title: 'Hourly Check', type: 'trigger', icon: '⏰', tech: 'Python script', description: 'Checks for emails stuck in inbox too long', schedule: 'Every 1 hour', script: 'stale_inbox_checker.py', status: 'active' },
      { id: 'si-2', title: 'Alert if Stale', type: 'notification', icon: '📱', tech: 'Telegram Bot API', description: 'Notify if emails are unprocessed for >1 hour', status: 'active' },
    ],
    edges: [
      { from: 'si-1', to: 'si-2' },
    ],
  },
];
