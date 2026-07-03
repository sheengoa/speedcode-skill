# Speedcode Skill

`speedcode-skill` 是一个用于小程序前端真实渲染检查的 Codex/AI Agent skill。它强调：视觉和交互质量必须通过开发者工具里的真实页面验证，不能只靠代码检查下结论。

当前重点支持微信小程序的自动化截图、页面检查和交互冒烟测试；抖音小程序目前覆盖 CLI 交付辅助，自动视觉 QA 需要额外的截图和元素检查链路。

## 能力概览

- 微信小程序：通过 WeChat DevTools 和 `miniprogram-automator` 打开页面、截图、读取选择器文本和布局信息，并生成 `summary.json`。
- 微信 AI/输入流：支持在配置文件中声明输入框、发送按钮、隐私弹窗同意按钮等选择器，执行简单问答或输入交互检查。
- 抖音小程序：辅助使用 `tt-ide-cli` 做登录状态、包体积、npm 构建、预览、上传和提审流程。
- 其他小程序运行时：只有在证明具备路由控制、元素检查和截图导出后，才按自动视觉 QA 处理。

## 适用场景

- 检查小程序页面是否存在标题栏、胶囊按钮、内容区碰撞。
- 验证按钮、输入框、底部固定操作区是否在真实设备尺寸下可用。
- 对 AI/chat 页面做发送、加载、结果追加和错误状态检查。
- 在提测或提交前保留截图和结构化摘要，方便定位 UI 问题。
- 明确区分“可自动截图验证”的平台和“只能 CLI 辅助交付”的平台。

## 安装

从 GitHub 安装：

```bash
npx skills add <github-owner>/<repo> -g --skill speedcode-skill
```

如果要安装给所有支持的 agent：

```bash
npx skills add <github-owner>/<repo> -g --all
```

更新已安装的 skill：

```bash
npx skills update speedcode-skill -g
```

## 使用方式

安装后，在支持 skills 的 AI Agent 中直接说明平台、项目路径和要检查的页面，例如：

```text
使用 speedcode-skill 检查微信小程序 /pages/index/index 页面，项目路径是 /path/to/wechat-project。
```

对于抖音项目，应明确它的能力边界：

```text
使用 speedcode-skill 辅助抖音小程序做包体积、预览和上传检查。
```

## 微信小程序快速开始

先安装或准备自动化依赖：

```bash
./speedcode-skill/scripts/ensure-wechat-automator.sh
```

检查单个页面：

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --route /pages/index/index \
  --out-dir /tmp/speedcode-vqa
```

使用配置文件检查多个页面：

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --config /path/to/visual-qa.json \
  --flow full \
  --out-dir /tmp/speedcode-vqa-full
```

检查 AI/输入流程：

```bash
node ./speedcode-skill/scripts/wechat-visual-qa.js \
  --project /path/to/wechat-project \
  --config /path/to/visual-qa.json \
  --flow ai \
  --ai-question "用一句话解释这个页面" \
  --out-dir /tmp/speedcode-vqa-ai
```

## 配置示例

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

脚本会在输出目录写入页面截图和 `summary.json`。报告问题时应包含页面路由、截图路径、可见症状、可能原因和建议修复点。

## 视觉检查标准

- 原生胶囊、返回按钮、标题和页面内容不能碰撞。
- 按钮尺寸稳定，文字居中，并有可见的按下或焦点反馈。
- 输入后输入框仍然可见，键盘或输入区不能遮挡关键内容。
- 页面在移动端不能出现拥挤卡片、裁切文本、横向溢出或过密布局。
- 底部固定操作区需要尊重安全区，不能覆盖正文。
- AI/chat 流程需要退出加载态，在当前页面追加回答，并隐藏技术错误。

## 抖音小程序支持范围

当前对抖音小程序的支持集中在 CLI 交付流程：

```bash
tma check-session
tma project-size --json /path/to/douyin-project
tma build-npm --project-path /path/to/douyin-project
tma preview --miniapp-path pages/index/index --qrcode-output /tmp/douyin-preview.png /path/to/douyin-project
tma upload -c "更新说明" -v 0.1.1 --qrcode-output /tmp/douyin-upload.png /path/to/douyin-project
tma audit --host douyin /path-or-appid
```

`tma preview` 生成的是预览二维码或 schema，不等同于真实页面截图。若要做自动视觉 QA，需要先具备可脚本化路由打开、元素检查和截图导出能力。

## 仓库结构

```text
speedcode-skill/
├── README.md
└── speedcode-skill/
    ├── SKILL.md
    ├── references/
    └── scripts/
```

这种结构允许同一个仓库后续继续添加多个 skills。

## 本地校验

发布前运行：

```bash
python3 /home/ao/.codex/skills/.system/skill-creator/scripts/quick_validate.py ./speedcode-skill
node --check ./speedcode-skill/scripts/wechat-visual-qa.js
```

发布后可检查安装器是否能识别：

```bash
npx skills add <github-owner>/<repo> --list
npx skills add <github-owner>/<repo> -g --skill speedcode-skill --copy
npx skills list -g
```
