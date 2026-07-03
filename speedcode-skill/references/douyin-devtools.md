# Douyin Boundary

Douyin support in this skill is centered on CLI-assisted delivery. Rendered visual QA requires a proven route-control, selector-inspection, and screenshot-export path.

## What Is Supported

Install/use the official CLI:

```bash
npm install -g tt-ide-cli
tma --help
```

Useful commands:

```bash
tma check-session
tma project-size --json /path/to/douyin-project
tma build-npm --project-path /path/to/douyin-project
tma preview --miniapp-path pages/index/index --qrcode-output /tmp/douyin-preview.png /path/to/douyin-project
tma upload -c "更新说明" -v 0.1.1 --qrcode-output /tmp/douyin-upload.png /path/to/douyin-project
tma audit --host douyin /path-or-appid
```

Use `TMA_CLI_HOME=/tmp/tma-home` when testing login state or tokens without touching the user's normal CLI home.

## Current Automation Gap

The current Douyin adapter does not provide:

- Scripted route relaunch.
- Selector text/box inspection.
- Unattended screenshot capture from an arbitrary route.
- AI-controlled click/type/screenshot/fix/retest loop.

The public `tt-ide-cli` command surface exposes project open, preview, upload, audit, size, build, login, and config commands. It does not expose a WeChat `miniprogram-automator` equivalent.

## Recording Replay

Douyin DevTools has IDE recording/replay tests with element assertions and screenshot actions. Treat this as manual or semi-automatic until a command-line replay/export path is proven.

Required proof before upgrading this skill:

- A command or API can start replay without manual IDE interaction.
- A route can be opened from script.
- Element state can be inspected from script.
- Screenshot files and pass/fail results can be exported predictably.

## Agent Rule

For Douyin, frame help around CLI preview, upload, package-size, build, and audit checks. Treat visual quality review as requiring user-provided screenshots or a future adapter with proven visual automation. `tma preview` produces a QR/schema, not a rendered screenshot.
