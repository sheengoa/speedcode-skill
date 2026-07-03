# Speedcode Skill 分发说明

目标：把 `speedcode-skill` 做成类似 `oh-story-claudecode` 的安装方式，让用户可以通过 `npx skills add ...` 从 GitHub 直接安装。

## 核心结论

不需要自己发布一个 npm 包。

推荐使用通用安装器 `skills`：

```bash
npx skills add <github-owner>/<repo> -g
```

例如未来仓库为 `yourname/speedcode-skill`：

```bash
npx skills add yourname/speedcode-skill -g
```

如果仓库里包含多个 skill，可以指定安装：

```bash
npx skills add yourname/speedcode-skill -g --skill speedcode-skill
```

## 推荐仓库结构

建议单独开一个 GitHub 仓库，不要和业务项目混在一起。

推荐结构：

```text
speedcode-skill/
├── speedcode-skill/
│   ├── SKILL.md
│   ├── scripts/
│   └── references/
└── README.md
```

如果只发布一个 skill，也可以让根目录就是 skill：

```text
speedcode-skill/
├── SKILL.md
├── scripts/
└── references/
```

更推荐第一种结构，后续可以继续扩展多个 skills。

## 发布步骤

1. 新建 GitHub 仓库。

```bash
mkdir speedcode-skill-repo
cp -R /path/to/speedcode-skill ./speedcode-skill-repo/speedcode-skill
cd speedcode-skill-repo
git init
git add .
git commit -m "初始化 speedcode skill"
git remote add origin git@github.com:yourname/speedcode-skill.git
git push -u origin main
```

2. 检查仓库内可识别的 skills。

```bash
npx skills add yourname/speedcode-skill --list
```

3. 全局安装。

```bash
npx skills add yourname/speedcode-skill -g --skill speedcode-skill
```

4. 如果要安装给所有支持的 agent：

```bash
npx skills add yourname/speedcode-skill -g --all
```

5. 更新已安装 skill：

```bash
npx skills update speedcode-skill -g
```

## 自测清单

发布前先本地验证：

```bash
python3 /home/ao/.codex/skills/.system/skill-creator/scripts/quick_validate.py ./speedcode-skill
node --check ./speedcode-skill/scripts/wechat-visual-qa.js
```

发布后验证：

```bash
npx skills add yourname/speedcode-skill --list
npx skills add yourname/speedcode-skill -g --skill speedcode-skill --copy
npx skills list -g
```

## 注意事项

- `npx skills add ...` 安装的是 GitHub 仓库里的 skill 目录，不是 npm 包。
- `SKILL.md` 的 `name` 必须稳定，例如当前为 `speedcode-skill`。
- `description` 要写触发条件，不要写流程摘要。
- 脚本必须带执行权限。
- 不要把业务项目、截图、临时测试日志、node_modules 放进 skill 仓库。
- 如果使用 `--copy`，安装结果是复制文件；不使用时 CLI 可能使用链接方式，取决于安装器行为。

## 面向用户的安装文案

```bash
npx skills add yourname/speedcode-skill -g --skill speedcode-skill
```

安装后，在支持 skills 的 AI 代理里说：

```text
使用 speedcode-skill 自动检查微信小程序页面。
```

对于抖音项目，说明当前能力边界：

```text
speedcode-skill 可以辅助抖音 CLI 预览、上传、包体积和提审流程，但不能承诺自动截图视觉 QA。
```
