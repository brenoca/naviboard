# Naviboard

A companion UI for AI agents running on [OpenClaw](https://github.com/openclaw/openclaw), that doubles as a beautiful personal productivity suite.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-local-green?style=flat-square&logo=sqlite)

## ✨ Features

| Tab | Description |
|-----|-------------|
| 🧠 **Second Brain** | Browse, search, and edit markdown files with raw/rendered toggle. Includes session transcript viewer. |
| ⏰ **Cron Jobs** | Manage OpenClaw + system crontab jobs. Toggle, trigger, delete. |
| 📋 **Tasks** | Kanban board with drag-and-drop. Local SQLite backend. |
| 🤖 **Agents** | View and manage active AI sessions and sub-agents. |
| 🧩 **Skills** | Browse installed skills, search ClawHub marketplace, filter by status. |
| 🔌 **Integrations** | Real-time status checks on connected APIs and services. |
| ❤️ **Health** | Track diet, workouts, sleep, fasting, supplements. Daily metrics dashboard with mood & energy. |
| 📖 **Journal** | Daily journaling with markdown, mood tracking, tags, streak counter, and 90-day heatmap. |
| 🎯 **Habits** | Habit tracker with weekly grid, streaks, completion rates, categories, and color coding. |
| 💬 **Chat** | Talk to your AI agent directly from the dashboard. Streams responses, loads session history. |
| 📊 **LLM Usage** | Model usage stats with charts — tokens, requests, cost per model. |

## 🎨 Design

Award-quality dark UI featuring:
- **Glassmorphism** — frosted glass cards with backdrop blur
- **Gradient accents** — violet-to-blue gradient theme with glowing elements
- **Micro-animations** — smooth transitions, hover effects, staggered entrances
- **Deep dark palette** — `#050507` base with layered translucency

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone
git clone https://github.com/brenoca/naviboard.git
cd naviboard

# Install dependencies
npm install

# Generate a secret token for authentication
# Add your OpenClaw gateway token for the Chat tab
cat > .env.local << EOF
DASHBOARD_SECRET=$(openssl rand -hex 16)
OPENCLAW_GATEWAY_TOKEN=your_gateway_token_here
EOF

# Run in development
npm run dev
```

Open `http://localhost:3333` and log in with your generated token.

### Production

```bash
# Build
npm run build

# Start
npm run start
```

### Systemd Service (optional)

```bash
# Copy the service file
sudo cp navi-dashboard.service /etc/systemd/system/

# Edit paths if needed
sudo nano /etc/systemd/system/navi-dashboard.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable navi-dashboard
sudo systemctl start navi-dashboard
```

## 🔐 Authentication

Token-based auth via middleware:

1. Set `DASHBOARD_SECRET` in `.env.local`
2. First visit: go to `http://localhost:3333?token=YOUR_SECRET` or use the login page
3. A secure cookie is set for 30 days

## 🔧 Configuration

### OpenClaw Integration

The dashboard reads from OpenClaw's filesystem and CLI for:
- **Chat** — streams via OpenClaw's `/v1/chat/completions` gateway endpoint
- **Second Brain** — reads `.md` files from the workspace directory
- **Cron** — calls `openclaw cron` CLI commands
- **Agents** — calls `openclaw sessions` CLI commands
- **Skills** — calls `openclaw skills list --json`
- **Integrations** — checks credential files at configurable paths

Edit `src/lib/exec.ts` to adjust the PATH if your OpenClaw installation is in a different location.

### Standalone Mode

Without OpenClaw, these tabs work independently:
- ✅ Tasks (Kanban)
- ✅ Health tracker
- ✅ Journal
- ✅ Habits
- ✅ Second Brain (for any markdown files)

The OpenClaw-specific tabs (Cron, Agents, Skills, Integrations, Usage) will show empty states gracefully.

### File Paths

Key paths to configure if self-hosting:

| What | Default Path | Where to change |
|------|-------------|-----------------|
| Chat session transcripts | `~/.openclaw/agents/main/sessions/` | `src/app/api/chat/history/route.ts` |
| Workspace/markdown files | `~/.openclaw/workspace/` | `src/app/api/brain/` |
| Session transcripts | `~/.openclaw/agents/main/sessions/` | `src/app/api/brain/file/route.ts` |
| SQLite database | `./data/tasks.db` | `src/lib/db.ts` |
| Integration credentials | `~/.openclaw/secrets/` | `src/app/api/integrations/route.ts` |
| OpenClaw CLI | `~/.npm-global/bin/openclaw` | `src/lib/exec.ts` |

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (local, zero-config)
- **Charts**: [Recharts](https://recharts.org/)
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **Icons**: [Lucide](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # All dashboard pages
│   │   ├── chat/           # AI Chat
│   │   ├── brain/          # Second Brain
│   │   ├── cron/           # Cron Jobs
│   │   ├── tasks/          # Kanban Tasks
│   │   ├── agents/         # AI Agents
│   │   ├── skills/         # Skills Manager
│   │   ├── integrations/   # Connected Services
│   │   ├── health/         # Health Tracker
│   │   ├── journal/        # Daily Journal
│   │   ├── habits/         # Habit Tracker
│   │   ├── usage/          # LLM Usage Stats
│   │   └── layout.tsx      # Dashboard layout + sidebar
│   ├── api/                # API routes (all server-side)
│   ├── login/              # Login page
│   └── globals.css         # Theme + animations
├── components/
│   ├── sidebar.tsx         # Navigation sidebar
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── db.ts               # SQLite database init
    ├── exec.ts             # Shell command runner
    └── utils.ts            # Tailwind utilities
```

## 📄 License

MIT

---

Built with 🧚 by [Navi](https://github.com/brenoca) — an AI companion running on OpenClaw.
