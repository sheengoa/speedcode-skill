---
name: speedcode-skill
description: Use when building, reviewing, or debugging mini-program frontends that require real rendered-page verification, developer-tool automation, screenshots, visual QA, interaction smoke tests, AI/chat checks, or platform parity checks for WeChat, Douyin, and similar mini-program runtimes.
---

# Speedcode Skill

Rendered UI is the contract. Do not approve visual or interaction work from code inspection alone when a developer-tool path exists.

## Decision Rule

- **WeChat**: use the bundled automation script. Screenshot, inspect, fix, and re-run.
- **Douyin**: use CLI for package, preview, upload, and audit support. Treat rendered visual QA as out of scope until an adapter proves route control, selector inspection, and screenshot export.
- **Other runtimes**: first prove the same three capabilities: route control, element inspection, screenshot export.

## Required Inputs

- Platform: `wechat`, `douyin`, or another runtime.
- Project root.
- Routes or a config file that declares flows.
- Output directory under `/tmp` for screenshots and `summary.json`.

## WeChat Flow

Prepare automator:

```bash
./speedcode-skill/scripts/ensure-wechat-automator.sh
```

Capture routes:

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --route /pages/index/index \
  --out-dir /tmp/speedcode-vqa
```

Run a configured flow:

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --config /path/to/visual-qa.json \
  --flow full \
  --out-dir /tmp/speedcode-vqa-full
```

Run an AI/input flow:

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --config /path/to/visual-qa.json \
  --flow ai \
  --ai-question "用一句话解释这个页面" \
  --out-dir /tmp/speedcode-vqa-ai
```

## Config Shape

```json
{
  "selectors": [".page-topbar", ".page-title", ".primary", ".composer"],
  "flows": {
    "full": ["/pages/index/index", "/pages/report/report"],
    "ai": {
      "welcomeRoute": "/pages/welcome/welcome",
      "route": "/pages/ai/ai",
      "inputSelector": "textarea",
      "sendSelector": ".composer button",
      "privacyAgreeSelector": ".privacy-actions button:last-child"
    }
  }
}
```

## Visual QA Standard

Open every generated screenshot before reporting success. Check:

- Native capsule, back button, title, and content do not collide.
- Buttons have stable size, centered text, and visible pressed/focus feedback.
- Inputs stay visible after typing; keyboard/composer layouts do not hide answers.
- Content breathes on mobile; no squeezed cards, crowded hero, clipped rows, or horizontal overflow.
- Sticky actions respect safe area and do not cover content.
- AI/chat flows release loading state, append the answer in the current view, and hide technical errors.

## Reporting Standard

For each issue, report route, screenshot path, visible symptom, likely cause, and exact fix. If only JSON state was inspected, say so and do not claim visual quality.

## References

- WeChat adapter details: `references/wechat-devtools.md`
- Douyin boundary and CLI use: `references/douyin-devtools.md`
