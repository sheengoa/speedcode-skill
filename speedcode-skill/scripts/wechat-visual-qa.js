#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const args = { routes: [], selectors: [], flow: 'routes', wait: 1500 };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key === '--project') args.project = next, i += 1;
    else if (key === '--route') args.routes.push(next), i += 1;
    else if (key === '--out-dir') args.outDir = next, i += 1;
    else if (key === '--cli') args.cli = next, i += 1;
    else if (key === '--port') args.port = Number(next), i += 1;
    else if (key === '--flow') args.flow = next, i += 1;
    else if (key === '--config') args.config = next, i += 1;
    else if (key === '--wait') args.wait = Number(next), i += 1;
    else if (key === '--selector') args.selectors.push(next), i += 1;
    else if (key === '--ai-question') args.aiQuestion = next, i += 1;
    else if (key === '--eval-file') args.evalFile = next, i += 1;
    else if (key === '--help' || key === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${key}`);
  }
  return args;
}

function usage() {
  return `Usage:
  node wechat-visual-qa.js --project <wechat-project> --route /pages/foo/foo --out-dir /tmp/vqa
  node wechat-visual-qa.js --project <wechat-project> --config visual-qa.json --flow full --out-dir /tmp/vqa
  node wechat-visual-qa.js --project <wechat-project> --config visual-qa.json --flow ai --ai-question "..." --out-dir /tmp/vqa

Options:
  --cli <path>         WeChat DevTools CLI path. Auto-detected when omitted.
  --port <number>      Automator launch port. Defaults to WECHAT_PORT or 29431.
  --config <path>      JSON config for app-specific routes, selectors, and flows.
  --selector <css>     Extra selector to capture text/box. Can repeat.
  --wait <ms>           Wait after route launch before capture. Defaults to 1500.
  --eval-file <path>   JS file exporting async function(miniProgram) to seed state.
`;
}

function findCli() {
  if (process.env.WECHAT_CLI && fs.existsSync(process.env.WECHAT_CLI)) return process.env.WECHAT_CLI;
  const shell = "find /tmp/appimage_extracted_* -maxdepth 2 -path '*/bin/wechat-devtools-cli' -type f 2>/dev/null | head -1";
  const found = spawnSync('bash', ['-lc', shell], { encoding: 'utf8' }).stdout.trim();
  if (found) return found;
  const appImage = '/home/ao/.local/bin/wechat-devtools.AppImage';
  if (fs.existsSync(appImage)) {
    spawnSync('bash', ['-lc', `nohup ${appImage} --appimage-extract-and-run >/tmp/wechat-devtools.log 2>&1 &`]);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6000);
    const afterStart = spawnSync('bash', ['-lc', shell], { encoding: 'utf8' }).stdout.trim();
    if (afterStart) return afterStart;
  }
  throw new Error('Cannot find wechat-devtools-cli. Start WeChat DevTools or pass --cli.');
}

function loadAutomator() {
  const candidates = [
    process.env.WECHAT_AUTOMATOR_DIR,
    '/tmp/wechat-devtools-automator',
  ].filter(Boolean);
  for (const dir of candidates) {
    const mod = path.join(dir, 'node_modules/miniprogram-automator');
    if (fs.existsSync(mod)) return require(mod);
  }
  try {
    return require('miniprogram-automator');
  } catch (err) {
    throw new Error('miniprogram-automator not found. Run scripts/ensure-wechat-automator.sh first.');
  }
}

function loadConfig(configPath) {
  if (!configPath) return {};
  const absolute = path.resolve(configPath);
  if (!fs.existsSync(absolute)) throw new Error(`Config file not found: ${absolute}`);
  const raw = fs.readFileSync(absolute, 'utf8');
  return JSON.parse(raw);
}

function safeLabel(route, index) {
  return `${String(index + 1).padStart(2, '0')}-${route.replace(/[\\/]/g, '-').replace(/^-/, '')}`;
}

async function text(page, selector) {
  const el = await page.$(selector);
  return el ? await el.text() : '';
}

async function box(page, selector) {
  const el = await page.$(selector);
  return el ? await el.size() : null;
}

async function capture(miniProgram, page, outDir, label, selectors) {
  const file = path.join(outDir, `${label}.png`);
  await miniProgram.screenshot({ path: file });
  const item = {
    label,
    route: page.path,
    screenshot: file,
    texts: {},
    boxes: {}
  };
  for (const selector of selectors) {
    item.texts[selector] = await text(page, selector);
    item.boxes[selector] = await box(page, selector);
  }
  try {
    item.pageData = await page.data();
    if (item.pageData && item.pageData.messages) {
      item.pageData.messages = item.pageData.messages.slice(-6);
    }
  } catch (err) {
    item.pageDataError = err.message;
  }
  return item;
}

async function maybeAcceptPrivacy(page, selector) {
  if (!selector) return;
  const agree = await page.$(selector);
  if (agree) {
    await agree.tap();
    await page.waitFor(800);
  }
}

async function runRoutes(miniProgram, args, selectors) {
  const results = [];
  for (let index = 0; index < args.routes.length; index += 1) {
    const route = args.routes[index];
    const page = await miniProgram.reLaunch(route);
    await page.waitFor(args.wait);
    results.push(await capture(miniProgram, page, args.outDir, safeLabel(route, index), selectors));
  }
  return results;
}

async function runConfiguredFlow(miniProgram, args, selectors, config, name) {
  const flow = config.flows && config.flows[name];
  const routes = Array.isArray(flow) ? flow : config.routes;
  if (!Array.isArray(routes) || !routes.length) {
    throw new Error(`Flow "${name}" needs config.flows.${name} or config.routes as a route array.`);
  }
  args.routes = routes;
  return runRoutes(miniProgram, args, selectors);
}

async function runAi(miniProgram, args, selectors, config) {
  const flow = config.flows && config.flows.ai;
  if (!flow || !flow.route) {
    throw new Error('AI flow needs config.flows.ai.route.');
  }
  const results = [];
  let page;
  if (flow.welcomeRoute) {
    page = await miniProgram.reLaunch(flow.welcomeRoute);
    await page.waitFor(args.wait);
    await maybeAcceptPrivacy(page, flow.privacyAgreeSelector);
  }
  page = await miniProgram.reLaunch(flow.route);
  await page.waitFor(args.wait);
  results.push(await capture(miniProgram, page, args.outDir, '01-ai-before', selectors));

  const input = await page.$(flow.inputSelector || 'textarea');
  const send = await page.$(flow.sendSelector || 'button');
  if (input && send) {
    await input.input(args.aiQuestion || '用一句话解释这个页面');
    await send.tap();
    await page.waitFor(Number(process.env.WECHAT_AI_WAIT_MS || 26000));
    page = await miniProgram.currentPage();
    results.push(await capture(miniProgram, page, args.outDir, '02-ai-after-send', selectors));
  } else {
    results.push({
      label: '02-ai-input-missing',
      route: page.path,
      error: 'AI flow input or send selector not found',
      inputSelector: flow.inputSelector || 'textarea',
      sendSelector: flow.sendSelector || 'button'
    });
  }
  return results;
}

(async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.project) throw new Error('--project is required');
  args.outDir = args.outDir || path.join('/tmp', `wechat-vqa-${Date.now()}`);
  fs.mkdirSync(args.outDir, { recursive: true });

  const config = loadConfig(args.config);
  const automator = loadAutomator();
  const cliPath = args.cli || findCli();
  const selectors = args.selectors.length ? args.selectors : (config.selectors || [
    '.page-topbar',
    '.topbar-title',
    '.ai-title',
    '.question',
    '.composer',
    '.error',
    '.typing'
  ]);

  const miniProgram = await automator.launch({
    cliPath,
    projectPath: args.project,
    port: args.port || Number(process.env.WECHAT_PORT || 29431),
    timeout: 60000,
    args: ['--lang', 'zh']
  });

  try {
    if (args.evalFile) {
      const seed = require(path.resolve(args.evalFile));
      await seed(miniProgram);
    }
    let results;
    if (args.flow === 'ai') results = await runAi(miniProgram, args, selectors, config);
    else if (args.flow !== 'routes') results = await runConfiguredFlow(miniProgram, args, selectors, config, args.flow);
    else {
      if (!args.routes.length) throw new Error('Provide at least one --route, or use --config with --flow <name>.');
      results = await runRoutes(miniProgram, args, selectors);
    }
    const summaryPath = path.join(args.outDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({ cliPath, project: args.project, outDir: args.outDir, results }, null, 2));
    console.log(JSON.stringify({ ok: true, summaryPath, outDir: args.outDir, results }, null, 2));
  } finally {
    await miniProgram.close();
  }
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
