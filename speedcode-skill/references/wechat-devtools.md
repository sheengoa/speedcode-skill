# WeChat Adapter

This adapter uses WeChat DevTools CLI, service port, and `miniprogram-automator`.

## Preconditions

- WeChat DevTools can open the project.
- `设置 -> 安全设置 -> 服务端口` is enabled.
- Node.js and npm are available.

## CLI Discovery

For Linux AppImage builds, start DevTools if needed and locate the CLI:

```bash
nohup /home/ao/.local/bin/wechat-devtools.AppImage --appimage-extract-and-run >/tmp/wechat-devtools.log 2>&1 &
find /tmp/appimage_extracted_* -maxdepth 2 -path '*/bin/wechat-devtools-cli' -type f 2>/dev/null | head -1
```

Check service port files:

```bash
cat ~/.config/wechat-devtools/Default/.ide 2>/dev/null
cat ~/.config/wechat-devtools/Default/.ide-status 2>/dev/null
```

If automation cannot connect, enable the service port or close stale DevTools instances.

## Commands

```bash
./speedcode-skill/scripts/ensure-wechat-automator.sh
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --route /pages/index/index \
  --out-dir /tmp/wechat-vqa
```

Use `--config` for app-specific selectors and flows. Use `--eval-file` only when a page needs seeded local state.

## Failure Modes

- CLI missing: start DevTools, then retry discovery.
- Service port closed: enable it in DevTools security settings.
- Route fails: confirm the route starts with `/pages/...` and exists in `app.json`.
- Empty state: increase `--wait`, seed state, or run the prerequisite flow first.
- Screenshot looks wrong: fix the UI and rerun the same command; do not reason from code alone.
