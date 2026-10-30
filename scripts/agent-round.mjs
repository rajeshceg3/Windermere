// Nightly agent round: one small safe improvement, opened as a draft PR.
// Free stack: GitHub Actions minutes (public repo) + GitHub Models free tier
// (GITHUB_TOKEN with `models: read`) + gh CLI for the PR. No paid keys.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "apps/web/src";
const MAX_FILES = 25;
const MAX_CHARS = 60000;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css|html)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(ROOT).slice(0, MAX_FILES);
let budget = MAX_CHARS;
const bundle = [];
for (const p of files) {
  const text = readFileSync(p, "utf8");
  if (text.length > budget) continue;
  budget -= text.length;
  bundle.push({ path: relative(".", p), content: text });
}

const prompt = readFileSync("prompts/nightly.md", "utf8");

const system = `You are a careful staff engineer doing one tiny improvement round on a visual web app.
Reply with STRICT JSON only, no markdown fences:
{"summary": "one sentence", "files": [{"path": "repo/relative/path", "content": "full new file content"}]}
Return {"summary": "no change", "files": []} when nothing is clearly safe and worthwhile.
Only return files you were shown. Never delete files. Keep the change tiny and reviewable.`;

const user = `${prompt}\n\nHere are the current files:\n` +
  bundle.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n");

const res = await fetch("https://models.github.ai/inference/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.GH_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  }),
});

if (!res.ok) {
  console.log(`Models request failed: ${res.status} ${await res.text()}`);
  process.exit(0); // never fail the schedule over a transient error
}

const data = await res.json();
let raw = data.choices?.[0]?.message?.content?.trim() ?? "";
raw = raw.replace(/^```(json)?|```$/g, "").trim();
let plan;
try {
  plan = JSON.parse(raw);
} catch {
  console.log("Model did not return parseable JSON; skipping.");
  process.exit(0);
}

const changes = Array.isArray(plan.files) ? plan.files : [];
const allowed = bundle.map((f) => f.path);
const safe = changes.filter(
  (f) => allowed.includes(f.path) && typeof f.content === "string" && f.content.length > 0
);

if (safe.length === 0) {
  console.log(`No change proposed. Summary: ${plan.summary ?? "n/a"}`);
  process.exit(0);
}

for (const f of safe) writeFileSync(f.path, f.content);
console.log(`Proposed: ${plan.summary}`);

try {
  execSync("pnpm install --frozen-lockfile", { stdio: "inherit" });
  execSync("pnpm --filter web build", { stdio: "inherit" });
} catch {
  console.log("Build failed with the change; discarding.");
  execSync("git checkout -- .", { stdio: "inherit" });
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const branch = `agent/round-${stamp}`;
execSync(`git checkout -b ${branch}`);
execSync('git config user.name "agent-round" && git config user.email "agent-round@users.noreply.github.com"');
execSync(`git add -A && git commit -m ${JSON.stringify(`Agent round ${stamp}: ${plan.summary}`)}`);
execSync(`git push -u origin ${branch}`, { stdio: "inherit" });

const body = [
  "## Agent round (draft)",
  "",
  `**What:** ${plan.summary}`,
  "",
  "Produced by the scheduled agent round (prompts/nightly.md) with the build",
  "passing locally in the runner. Draft on purpose - review, then merge or close.",
].join("\n");
execSync(
  `gh pr create --draft --base develop --head ${branch} --title ${JSON.stringify(`Agent round ${stamp}: ${plan.summary}`.slice(0, 70))} --body-file -`,
  { input: body, stdio: ["pipe", "inherit", "inherit"] }
);
