/**
 * Apply GitHub branch protection on `main` (PR + review + CI typecheck).
 *
 * Requires a token with `repo` or `admin:repo_hook` + admin access:
 *   GITHUB_TOKEN=ghp_... node scripts/apply-branch-protection.mjs
 *
 * Or after `gh auth login`:
 *   gh auth token | node scripts/apply-branch-protection.mjs
 *
 * Optional env:
 *   GITHUB_OWNER (default Mendocan)
 *   GITHUB_REPO  (default eilcard)
 *   GITHUB_BRANCH (default main)
 */
const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
const owner = process.env.GITHUB_OWNER?.trim() || "Mendocan";
const repo = process.env.GITHUB_REPO?.trim() || "eilcard";
const branch = process.env.GITHUB_BRANCH?.trim() || "main";

if (!token) {
  console.error(
    "[branch-protection] Set GITHUB_TOKEN or GH_TOKEN (repo admin scope)"
  );
  process.exit(1);
}

const body = {
  required_status_checks: {
    strict: true,
    contexts: ["typecheck"],
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    required_approving_review_count: 1,
  },
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
};

const url = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}/protection`;

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let payload;
try {
  payload = text ? JSON.parse(text) : null;
} catch {
  payload = text;
}

if (!res.ok) {
  console.error("[branch-protection] failed", res.status, payload);
  process.exit(1);
}

console.log(`[branch-protection] applied on ${owner}/${repo}:${branch}`);
console.log("[branch-protection] PR required · 1 review · CI typecheck · no force-push");
