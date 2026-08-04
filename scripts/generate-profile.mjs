import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");

const readYaml = async (path) => YAML.parse(await readFile(resolve(root, path), "utf8"));
const config = await readYaml("profile.config.yml");
const memoryConfig = await readYaml("content/public-memories.yml");

assertConfig(config, memoryConfig);

const outputs = new Map();
for (const mode of ["dark", "light"]) {
  outputs.set(`assets/generated/hero-${mode}.svg`, renderHero(config, mode, true));
  outputs.set(`assets/generated/hero-static-${mode}.svg`, renderHero(config, mode, false));
  outputs.set(`assets/generated/chronicle-${mode}.svg`, renderChronicle(config, mode));
}
outputs.set("assets/generated/metrics-fallback.svg", renderMetricsPlaceholder(config));
outputs.set("README.md", renderReadme(config, memoryConfig, "en"));
outputs.set("README.zh-CN.md", renderReadme(config, memoryConfig, "zh"));

let failures = 0;
for (const [relativePath, content] of outputs) {
  const target = resolve(root, relativePath);
  const normalized = `${content.trimEnd()}\n`;
  let existing = null;
  try {
    existing = await readFile(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (existing === normalized) continue;
  if (checkOnly) {
    console.error(`OUTDATED: ${relativePath}`);
    failures += 1;
    continue;
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, normalized, "utf8");
  console.log(`WROTE: ${relativePath}`);
}

if (failures > 0) {
  console.error("Run `npm run generate` and commit the generated files.");
  process.exit(1);
}

function assertConfig(data, memories) {
  const required = [
    [data?.version === 1, "profile.config.yml version must be 1"],
    [data?.profile?.username, "profile.username is required"],
    [data?.profile?.email, "profile.email is required"],
    [data?.projects?.some((project) => project.featured), "one featured project is required"],
    [memories?.version === 1, "public memories version must be 1"],
    [memories?.memories?.some((memory) => memory.active), "one public memory must be active"],
  ];
  for (const [condition, message] of required) {
    if (!condition) throw new Error(message);
  }
  for (const memory of memories.memories) {
    if (!memory.text?.en || !memory.text?.zh || !memory.source?.en || !memory.source?.zh) {
      throw new Error(`public memory ${memory.id ?? "<unknown>"} is incomplete`);
    }
  }
}

function t(value, language) {
  if (typeof value === "string") return value;
  return value?.[language] ?? value?.en ?? "";
}

function tracked(url, content) {
  const target = new URL(url);
  target.searchParams.set("utm_source", config.campaign.source);
  target.searchParams.set("utm_medium", config.campaign.medium);
  target.searchParams.set("utm_campaign", config.campaign.name);
  target.searchParams.set("utm_content", content);
  return target.toString();
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderHero(data, mode, animated) {
  const color = data.theme[mode];
  const motion = animated
    ? `
    .trace { stroke-dasharray: 12 12; animation: trace 9s linear infinite; }
    .pulse { animation: pulse 3.2s ease-in-out infinite; transform-origin: center; }
    .float-a { animation: float 5.5s ease-in-out infinite; }
    .float-b { animation: float 6.5s ease-in-out -1.4s infinite; }
    @keyframes trace { to { stroke-dashoffset: -240; } }
    @keyframes pulse { 0%, 100% { opacity: .48; transform: scale(.94); } 50% { opacity: 1; transform: scale(1.08); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @media (prefers-reduced-motion: reduce) { .trace, .pulse, .float-a, .float-b { animation: none; } }`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" role="img" aria-labelledby="title description">
  <title id="title">Zhiyuan's Living Memory Lab</title>
  <desc id="description">A research notebook connected to evidence, memory, and trustworthy AI systems.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color.background}"/>
      <stop offset="1" stop-color="${color.surface}"/>
    </linearGradient>
    <linearGradient id="signal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${color.primary}"/>
      <stop offset=".52" stop-color="${color.secondary}"/>
      <stop offset="1" stop-color="${color.accent}"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${color.muted}" stroke-opacity=".10"/>
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <style>
    text { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
    .eyebrow { font-size: 16px; letter-spacing: 3px; fill: ${color.primary}; }
    .name { font-size: 60px; font-weight: 760; fill: ${color.text}; }
    .tagline { font-size: 22px; fill: ${color.muted}; }
    .label { font-size: 14px; fill: ${color.muted}; letter-spacing: 1px; }
    .paper { font-size: 13px; fill: #3D4652; }
${motion}
  </style>
  <rect width="1200" height="420" rx="28" fill="url(#bg)"/>
  <rect width="1200" height="420" rx="28" fill="url(#grid)"/>
  <circle cx="1080" cy="62" r="124" fill="${color.secondary}" opacity=".08"/>
  <circle cx="980" cy="390" r="156" fill="${color.primary}" opacity=".06"/>

  <g transform="translate(66 80)">
    <text class="eyebrow" y="0">LIVING MEMORY LAB / 01</text>
    <text class="name" y="78">${xml(data.profile.name)}</text>
    <text class="tagline" y="126">Reliable AI · Auditable Agents</text>
    <text class="tagline" y="160">Knowledge Infrastructure</text>
    <path class="trace" d="M0 218 C160 170 245 282 414 222 S676 190 770 236" fill="none" stroke="url(#signal)" stroke-width="3" opacity=".92"/>
    <g transform="translate(0 252)">
      <circle class="pulse" cx="8" cy="8" r="8" fill="${color.primary}"/>
      <text class="label" x="28" y="13">QUESTION</text>
      <circle class="pulse" cx="152" cy="8" r="8" fill="${color.secondary}"/>
      <text class="label" x="172" y="13">EVIDENCE</text>
      <circle class="pulse" cx="316" cy="8" r="8" fill="${color.accent}"/>
      <text class="label" x="336" y="13">MEMORY</text>
    </g>
  </g>

  <g class="float-a" transform="translate(790 58) rotate(-3 145 135)">
    <rect width="292" height="270" rx="16" fill="${color.paper}"/>
    <rect x="22" y="22" width="248" height="112" rx="9" fill="${color.background}" opacity=".84"/>
    <circle cx="66" cy="68" r="22" fill="${color.primary}" opacity=".85"/>
    <path d="M24 118l62-48 46 34 50-48 86 62" fill="none" stroke="${color.secondary}" stroke-width="5" opacity=".72"/>
    <text class="paper" x="24" y="168">2026 / MEMORY SHARD</text>
    <text class="paper" x="24" y="198">keep the path back to</text>
    <text class="paper" x="24" y="220">what actually happened.</text>
    <path d="M24 242h162" stroke="${color.accent}" stroke-width="3"/>
  </g>
  <g class="float-b" transform="translate(1020 258) rotate(5)">
    <rect width="120" height="78" rx="12" fill="${color.surface}" stroke="${color.primary}" stroke-opacity=".7"/>
    <text class="label" x="18" y="32">TRACE</text>
    <text class="label" x="18" y="54">VERIFIED</text>
  </g>
</svg>`;
}

function renderChronicle(data, mode) {
  const color = data.theme[mode];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 420" role="img" aria-labelledby="title description">
  <title id="title">Chronicle Memory notebook</title>
  <desc id="description">A photo and note become a traceable page in a private personal journal.</desc>
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color.surface}"/><stop offset="1" stop-color="${color.background}"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-opacity=".18"/></filter>
  </defs>
  <style>
    text { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .tiny { font-size: 14px; fill: ${color.muted}; letter-spacing: 1px; }
    .copy { font-size: 17px; fill: #3E4652; }
  </style>
  <rect width="760" height="420" rx="26" fill="url(#surface)"/>
  <path d="M48 72C204 24 310 92 408 66s180-22 302 14" fill="none" stroke="${color.primary}" stroke-width="2" stroke-dasharray="7 10" opacity=".45"/>
  <g transform="translate(92 54)" filter="url(#shadow)">
    <path d="M0 28Q0 0 28 0h238q34 0 44 28 10-28 44-28h238q28 0 28 28v294q0 22-22 22H346q-26 0-36 22-10-22-36-22H22Q0 344 0 322Z" fill="${color.paper}"/>
    <path d="M310 28v338" stroke="#B6A994" stroke-width="2" opacity=".7"/>
    <rect x="28" y="34" width="226" height="128" rx="10" fill="${color.background}" opacity=".82"/>
    <circle cx="82" cy="86" r="25" fill="${color.accent}" opacity=".88"/>
    <path d="M30 146l68-56 44 34 54-54 56 52" fill="none" stroke="${color.primary}" stroke-width="6"/>
    <text class="copy" x="30" y="204">Today, pasted gently.</text>
    <text class="copy" x="30" y="234">Source kept intact.</text>
    <path d="M30 270h214M30 294h164" stroke="#8C8375" stroke-width="3" opacity=".38"/>
    <text class="tiny" x="346" y="62">TRACEABLE MEMORY</text>
    <g transform="translate(360 98)">
      <circle cx="0" cy="0" r="8" fill="${color.primary}"/>
      <circle cx="0" cy="72" r="8" fill="${color.secondary}"/>
      <circle cx="0" cy="144" r="8" fill="${color.accent}"/>
      <path d="M0 8v56m0 16v56" stroke="#7C8490" stroke-width="3"/>
      <text class="copy" x="24" y="6">original photo + note</text>
      <text class="copy" x="24" y="78">event + context</text>
      <text class="copy" x="24" y="150">story, with evidence</text>
    </g>
    <rect x="346" y="276" width="208" height="40" rx="20" fill="${color.primary}" opacity=".16"/>
    <text class="tiny" x="370" y="302">PRIVATE BY DESIGN</text>
  </g>
</svg>`;
}

function renderMetricsPlaceholder(data) {
  const color = data.theme.dark;
  const systems = String(data.projects.length).padStart(2, "0");
  const traces = String(data.open_source_traces.length).padStart(2, "0");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 250" role="img" aria-labelledby="title description">
  <title id="title">Living Memory Lab system pulse</title>
  <desc id="description">A stable system pulse summarizing the public profile structure.</desc>
  <style>
    text { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .title { font-size: 22px; fill: ${color.text}; font-weight: 700; }
    .label { font-size: 13px; fill: ${color.muted}; letter-spacing: 1px; }
    .value { font-size: 24px; fill: ${color.primary}; }
  </style>
  <rect width="900" height="250" rx="22" fill="${color.background}"/>
  <path d="M38 190H862" stroke="${color.muted}" stroke-opacity=".22"/>
  <path d="M38 180h90l18-24 28 48 24-40 32 16h96l20-20 28 34 26-38 28 24h424" fill="none" stroke="${color.primary}" stroke-width="4"/>
  <text class="label" x="38" y="42">LOCAL SNAPSHOT / SAFE FALLBACK</text>
  <text class="title" x="38" y="78">Living Memory Lab system pulse</text>
  <text class="value" x="604" y="78">ONLINE</text>
  <text class="value" x="38" y="126">${systems}</text>
  <text class="label" x="78" y="124">PUBLIC SYSTEMS</text>
  <text class="value" x="286" y="126">${traces}</text>
  <text class="label" x="326" y="124">VERIFIABLE TRACES</text>
  <text class="value" x="588" y="126">02</text>
  <text class="label" x="628" y="124">LANGUAGE EDITIONS</text>
  <text class="label" x="38" y="224">LOCAL SNAPSHOT · SAFE TO FAIL · LAST KNOWN RESULT STAYS VISIBLE</text>
</svg>`;
}

function renderReadme(data, memories, language) {
  const ui = language === "en"
    ? {
        other: "简体中文",
        otherFile: "README.zh-CN.md",
        heroAlt: "Zhiyuan's Living Memory Lab: reliable AI, auditable agents, and knowledge infrastructure",
        chronicleAlt: "Chronicle Memory turns photos and notes into a private, traceable personal journal",
        openChronicle: "Open the live notebook ↗",
        deployment: "Private deployment ↗",
        source: "Public source ↗",
        status: "Current boundary",
        work: "Systems you can enter",
        system: "System",
        why: "Why it exists",
        route: "Route",
        open: "Open ↗",
        trust: "How I build for trust",
        atlas: "Continue into the knowledge garden",
        atlasCopy: "The Atlas connects long-form writing, algorithm practice, and a knowledge graph extracted from more than 100 documents.",
        garden: "Enter the Atlas ↗",
        writing: "Read the writing ↗",
        questions: "Questions currently running in the lab",
        trace: "Verifiable open-source traces",
        upstream: "Upstream",
        contribution: "Contribution",
        metricsAlt: "Daily public GitHub metrics snapshot",
        colon: ":",
        configDesc: "identity, projects, palette, links, and module switches",
        memoriesDesc: "hand-approved public memory shards",
        generatorDesc: "deterministic bilingual Markdown and SVG generator",
        workflowsDesc: "profile build, metrics snapshot, and contribution snake",
        lab: "🧪 Open my lab — research questions, public work, and live metrics",
        play: "🎮 Play with my GitHub — memory shard, alter ego, and contribution snake",
        remix: "🛠️ Remix this profile — config, modules, and safe defaults",
        memory: "PUBLIC MEMORY SHARD",
        persona: "Hollow Otaku Rogue, after hours",
        generated: "This profile is generated from `profile.config.yml`. Edit the config, run `npm run generate`, and the bilingual pages and SVG assets update together.",
        guide: "Read the remix guide ↗",
        archive: "Browse the archived profile ↗",
        collaborate: "Discuss a collaboration",
        follow: "Follow on GitHub",
        footer: "Built as a small, forkable profile engine. Public data may update automatically; private Chronicle data never enters this repository.",
      }
    : {
        other: "English",
        otherFile: "README.md",
        heroAlt: "Zhiyuan 的活着的记忆实验室：可靠 AI、可审计 Agent 与知识基础设施",
        chronicleAlt: "Chronicle Memory 将照片与文字变成私密、可追溯的个人手账",
        openChronicle: "打开在线手账 ↗",
        deployment: "私有部署入口 ↗",
        source: "公开源码 ↗",
        status: "当前边界",
        work: "可以直接进入的系统",
        system: "系统",
        why: "存在的理由",
        route: "入口",
        open: "打开 ↗",
        trust: "我怎样构建可信系统",
        atlas: "继续进入知识花园",
        atlasCopy: "Atlas 连接长篇写作、算法练习，以及从一百多份文档中抽取的知识图谱。",
        garden: "进入 Atlas ↗",
        writing: "阅读文章 ↗",
        questions: "实验室里正在运行的问题",
        trace: "可核验的开源痕迹",
        upstream: "上游项目",
        contribution: "贡献",
        metricsAlt: "每日更新的公开 GitHub 指标快照",
        colon: "：",
        configDesc: "身份、项目、配色、链接与模块开关",
        memoriesDesc: "经过人工批准的公开记忆碎片",
        generatorDesc: "确定性的双语 Markdown 与 SVG 生成器",
        workflowsDesc: "主页生成、指标快照与贡献蛇工作流",
        lab: "🧪 打开实验室：研究问题、公开贡献与动态指标",
        play: "🎮 玩一会儿我的 GitHub：记忆碎片、隐藏人格与贡献蛇",
        remix: "🛠️ 复刻这套主页：配置、模块与安全默认值",
        memory: "公开记忆碎片",
        persona: "下班后的 Hollow Otaku Rogue",
        generated: "这份主页由 `profile.config.yml` 生成。修改配置并运行 `npm run generate`，中英文页面与 SVG 资源会同步更新。",
        guide: "阅读 DIY 指南 ↗",
        archive: "查看旧版主页归档 ↗",
        collaborate: "讨论合作",
        follow: "在 GitHub 关注我",
        footer: "一套小而可 Fork 的主页引擎。公开数据可以自动更新，Chronicle 私人数据永不进入这个仓库。",
      };

  const featured = data.projects.find((project) => project.featured);
  const secondary = data.projects.filter((project) => !project.featured);
  const activeMemory = memories.memories.find((memory) => memory.active);
  const emailSubject = encodeURIComponent("Collaboration via GitHub profile");
  const archiveFile = language === "en" ? "README.legacy.en.md" : "README.legacy.zh-CN.md";
  const projectRows = secondary.map((project) => {
    const demo = data.links[project.demo_link];
    const source = project.source_link ? data.links[project.source_link] : null;
    const links = [`<a href="${tracked(demo, `${project.id}-card`)}"><b>${ui.open}</b></a>`];
    if (source) links.push(`<a href="${source}">${ui.source}</a>`);
    return `<tr>
  <td><strong>${project.name}</strong></td>
  <td>${t(project.description, language)}</td>
  <td>${links.join(" · ")}</td>
</tr>`;
  }).join("\n");

  const pillarCells = data.pillars.map((pillar) => `<td width="33%" valign="top"><strong>${t(pillar.title, language)}</strong><br/><sub>${t(pillar.body, language)}</sub></td>`).join("\n");
  const questions = data.current_questions.map((question) => `- ${t(question, language)}`).join("\n");
  const traces = data.open_source_traces.map((item) => `| [${item.project}](${item.url}) | ${t(item.contribution, language)} |`).join("\n");
  const personal = data.personal.details.map((item) => `- ${t(item, language)}`).join("\n");

  return `<!-- GENERATED FILE. Edit profile.config.yml and run npm run generate. -->
<div align="center">

<picture>
  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="./assets/generated/hero-static-dark.svg" />
  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: light)" srcset="./assets/generated/hero-static-light.svg" />
  <source media="(prefers-color-scheme: dark)" srcset="./assets/generated/hero-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/generated/hero-light.svg" />
  <img src="./assets/generated/hero-static-light.svg" alt="${ui.heroAlt}" width="100%" />
</picture>

[${language === "en" ? "English" : "简体中文"}](./${language === "en" ? "README.md" : "README.zh-CN.md"}) · [${ui.other}](./${ui.otherFile})

### ${t(data.profile.role, language)}

${t(data.profile.introduction, language)}

> ${t(data.profile.principle, language)}

</div>

## ${featured.name}

<table>
<tr>
<td width="54%" valign="top">

### ${t(featured.promise, language)}

${t(featured.description, language)}

**${ui.status}${ui.colon}** ${t(featured.status, language)}

<a href="${tracked(data.links[featured.demo_link], "chronicle-hero")}"><b>${ui.openChronicle}</b></a> · <a href="${tracked(data.links[featured.deployment_link], "chronicle-deployment")}">${ui.deployment}</a> · <a href="${data.links[featured.source_link]}">${ui.source}</a>

</td>
<td width="46%" valign="top">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/generated/chronicle-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/generated/chronicle-light.svg" />
  <img src="./assets/generated/chronicle-light.svg" alt="${ui.chronicleAlt}" width="100%" />
</picture>
</td>
</tr>
</table>

## ${ui.work}

<table>
<thead><tr><th>${ui.system}</th><th>${ui.why}</th><th>${ui.route}</th></tr></thead>
<tbody>
${projectRows}
</tbody>
</table>

## ${ui.trust}

<table><tr>
${pillarCells}
</tr></table>

## ${ui.atlas}

${ui.atlasCopy}

[**${ui.garden}**](${tracked(data.links.atlas, "atlas-route")}) · [${ui.writing}](${tracked(data.links.writing, "writing-route")})

<details>
<summary><strong>${ui.lab}</strong></summary>

### ${ui.questions}

${questions}

### ${ui.trace}

| ${ui.upstream} | ${ui.contribution} |
|:--|:--|
${traces}

<p align="center">
  <img src="./assets/snapshots/metrics.svg" alt="${ui.metricsAlt}" width="92%" />
</p>

</details>

<details>
<summary><strong>${ui.play}</strong></summary>

### ${ui.memory} · ${activeMemory.date}

> ${t(activeMemory.text, language)}
>
> <sub>${t(activeMemory.source, language)}</sub>

### ${ui.persona}

${personal}

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${data.profile.username}/${data.profile.username}/gh-pages/github-contribution-grid-snake-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${data.profile.username}/${data.profile.username}/gh-pages/github-contribution-grid-snake.svg" />
  <img alt="Zhiyuan's contribution graph animated as a snake" src="https://raw.githubusercontent.com/${data.profile.username}/${data.profile.username}/gh-pages/github-contribution-grid-snake.svg" width="100%" />
</picture>

</details>

<details>
<summary><strong>${ui.remix}</strong></summary>

${ui.generated}

- [\`profile.config.yml\`](./profile.config.yml): ${ui.configDesc}
- [\`content/public-memories.yml\`](./content/public-memories.yml): ${ui.memoriesDesc}
- [\`scripts/generate-profile.mjs\`](./scripts/generate-profile.mjs): ${ui.generatorDesc}
- [\`.github/workflows/\`](./.github/workflows): ${ui.workflowsDesc}

[**${ui.guide}**](./docs/REMIX.md) · [${ui.archive}](./content/archive/${archiveFile})

</details>

<div align="center">

### [${ui.collaborate}](mailto:${data.profile.email}?subject=${emailSubject}) · [${ui.follow}](https://github.com/${data.profile.username})

<sub>${ui.footer}</sub>

</div>`;
}
