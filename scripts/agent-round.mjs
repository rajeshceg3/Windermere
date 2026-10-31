#!/usr/bin/env node
/**
 * Nightly agent round (model-free).
 * GitHub Models was retired 2026-07-30, so the round is deterministic:
 *   Check A: build health on develop. Broken -> one GitHub issue (deduped).
 *   Check B: minor/patch dependency bumps -> draft PR, gated on a green build.
 * Every outcome appends a dated line to .agent/learnings.md, committed back
 * to develop (or offered as a draft PR when the build is broken).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const REPO = process.env.GITHUB_REPOSITORY; // owner/name
const [OWNER, REPO_NAME] = (REPO || "").split("/");
const TOKEN = process.env.GH_TOKEN;
const API = "https://api.github.com";
const HDRS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2026-03-10",
  "Content-Type": "application/json",
  "User-Agent": "agent-round",
};

const day = new Date().toISOString().slice(0, 10);
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const tryRun = (cmd) => {
  try { execSync(cmd, { stdio: "pipe" }); return { ok: true }; }
  catch (e) { return { ok: false, out: String(e.stdout || "") + String(e.stderr || "") }; }
};

function readOptional(path) {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
}
function logLearning(line) {
  try {
    const prev = readOptional(".agent/learnings.md");
    writeFileSync(".agent/learnings.md", `${prev.trimEnd()}\n- ${day}: ${line}\n`);
  } catch { /* learning log never blocks the round */ }
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: HDRS, ...opts });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

if (!TOKEN) {
  console.log("GH_TOKEN is not set; cannot run. Exiting cleanly.");
  process.exit(0);
}

/* git identity for commits the round makes */
run(`git config user.name "agent-round[bot]"`);
run(`git config user.email "agent-round[bot]@users.noreply.github.com"`);

/* ---------- Check A: build health ---------- */
run("corepack enable");
const install = tryRun("pnpm install --frozen-lockfile");
const build = install.ok ? tryRun("pnpm --filter web build") : { ok: false, out: install.out };

if (!build.ok) {
  console.log("Build is broken on develop.");
  logLearning(`Build broken on develop: ${build.out.split("\n").find((l) => /error/i.test(l)) || "see CI logs"}`);
  /* dedupe: one open issue at a time */
  const issues = await api(`/search/issues?q=${encodeURIComponent(`repo:${OWNER}/${REPO_NAME} is:issue is:open "Build broken on develop" in:title`)}&per_page=5`);
  const already = issues.body && Array.isArray(issues.body.items) && issues.body.items.length > 0;
  if (!already) {
    const made = await api(`/repos/${OWNER}/${REPO_NAME}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: "Build broken on develop",
        body: `The nightly round found \`pnpm --filter web build\` failing on develop (${day}).\n\nFirst error line:\n\`\`\`\n${(build.out.split("\n").find((l) => /error/i.test(l)) || "see CI logs").slice(0, 400)}\n\`\`\`\nFiled by the agent round.`,
      }),
    });
    console.log(made.status === 201 ? "Issue filed." : `Issue filing failed: ${made.status}`);
  } else {
    console.log("Open agent-round issue already exists; not filing a duplicate.");
  }
  /* persist the learning via a draft PR (develop may be protected) */
  run(`git checkout -b agent-round/learning-${day.replaceAll("-", "")}`);
  run(`git add .agent/learnings.md`);
  run(`git commit -m "agent round ${day}: build broken (learning only)"`);
  run(`git push -u origin HEAD`);
  await api(`/repos/${OWNER}/${REPO_NAME}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `Agent round ${day}: build broken (learning)`,
      head: `agent-round/learning-${day.replaceAll("-", "")}`,
      base: "develop",
      draft: true,
      body: "Build gate failed; only the learning is kept. Fix the build, then close or merge.",
    }),
  });
  process.exit(0);
}
console.log("Build is green.");

/* ---------- Check B: dependency gardener (minor/patch only) ---------- */
const pkgPath = "apps/web/package.json";
if (!existsSync(pkgPath)) {
  console.log("No apps/web/package.json; nothing to garden.");
  logLearning("No package.json found; round idled.");
  run(`git add -A && git commit -m "agent round ${day}: idle" || true`);
  tryRun("git push origin HEAD:develop");
  process.exit(0);
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const names = Object.keys(deps);
let bumped = [];
for (const name of names) {
  const range = deps[name];
  const current = range.replace(/^[\^~]/, "");
  const meta = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}/latest`, {
    headers: { Accept: "application/json" },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!meta || !meta.version) continue;
  const [cMaj, cMin, cPat] = current.split(".").map((n) => parseInt(n, 10) || 0);
  const [lMaj, lMin, lPat] = meta.version.split(".").map((n) => parseInt(n, 10) || 0);
  const isMinorOrPatch = lMaj === cMaj && (lMin > cMin || (lMin === cMin && lPat > cPat));
  if (isMinorOrPatch) bumped.push([name, current, meta.version]);
}
if (bumped.length === 0) {
  console.log("All dependencies current (minor/patch).");
  logLearning("Round ran: build green, dependencies current.");
  run(`git add .agent/learnings.md && git commit -m "agent round ${day}: all green" || true`);
  tryRun("git push origin HEAD:develop");
  process.exit(0);
}
console.log(`Bumps available: ${bumped.map(([n, , v]) => `${n}@${v}`).join(", ")}`);
const branch = `agent-round/deps-${day.replaceAll("-", "")}`;
run(`git checkout -b ${branch}`);
for (const [name, , latest] of bumped) {
  const prefix = deps[name].startsWith("~") ? "~" : "^";
  if (pkg.dependencies && pkg.dependencies[name]) pkg.dependencies[name] = `${prefix}${latest}`;
  if (pkg.devDependencies && pkg.devDependencies[name]) pkg.devDependencies[name] = `${prefix}${latest}`;
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
const reinstall = tryRun("pnpm install --no-frozen-lockfile");
const rebuild = reinstall.ok ? tryRun("pnpm --filter web build") : { ok: false };
if (!rebuild.ok) {
  console.log("Bumps break the build; discarding, keeping the learning.");
  logLearning(`Skipped bumps (build failed): ${bumped.map(([n, c, v]) => `${n} ${c}->${v}`).join(", ")}`);
  run("git checkout -- .");
  run(`git add .agent/learnings.md && git commit -m "agent round ${day}: bumps skipped" || true`);
  tryRun("git push origin HEAD:develop");
  process.exit(0);
}
run("git add -A");
run(`git commit -m "agent round ${day}: bump ${bumped.map(([n, , v]) => `${n}@${v}`).join(", ")}"`);
run(`git push -u origin ${branch}`);
const pr = await api(`/repos/${OWNER}/${REPO_NAME}/pulls`, {
  method: "POST",
  body: JSON.stringify({
    title: `Agent round ${day}: dependency bumps`,
    head: branch,
    base: "develop",
    draft: true,
    body: `Minor/patch bumps, build green:\n\n${bumped.map(([n, c, v]) => `- ${n}: ${c} -> ${v}`).join("\n")}\n\nFiled by the nightly agent round.`,
  }),
});
console.log(pr.status === 201 ? `Draft PR opened: ${pr.body.html_url}` : `PR failed: ${pr.status} ${JSON.stringify(pr.body).slice(0, 200)}`);
logLearning(`Opened bump PR: ${bumped.map(([n, c, v]) => `${n} ${c}->${v}`).join(", ")}`);
