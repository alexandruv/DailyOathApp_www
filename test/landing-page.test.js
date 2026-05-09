import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createAppServer } from "../server.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

const close = (server) => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

test("landing page renders the selected tarot progression narrative", async () => {
  const html = await read("index.html");

  assert.match(html, /Daily Oath/);
  assert.match(html, /Walk the year\s+card by card\./);
  assert.match(html, /RECOVERY AS ARCHETYPAL PROGRESS/);
  assert.match(html, /Begin the first oath/);
  assert.match(html, /View the rank path/);
});

test("landing page includes the core product sections from the Figma direction", async () => {
  const html = await read("index.html");

  assert.match(html, /THE RANK PATH/);
  assert.match(html, /THE APP EXPERIENCE/);
  assert.match(html, /DAILY OATH/);
  assert.match(html, /URGE MODE/);
  assert.match(html, /RESETS/);
  assert.match(html, /Get notified when Daily Oath is available/);
});

test("rank cards section teases the wider recovery arc", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");

  assert.match(html, /And many more\./);
  assert.match(html, /Sixteen recovery archetypes mark the year/);
  assert.match(html, /The next card is never just art/);
  assert.match(css, /\.rank-tease/);
});

test("landing page exposes mobile app preview and recovery tarot card artwork", async () => {
  const html = await read("index.html");

  assert.match(html, /aria-label="Daily Oath app progress preview"/);
  assert.match(html, /aria-label="Recovery tarot rank cards"/);
  assert.match(html, /The Rooted Resolve/);
  assert.match(html, /The First Oath/);
  assert.match(html, /The Tempered Will/);
  assert.doesNotMatch(html, /The Lantern Bearer/);
});

test("landing page uses the actual tarot card image assets from the mobile app", async () => {
  const html = await read("index.html");
  const requiredAssets = [
    "assets/ranks/tarot/first-oath.png",
    "assets/ranks/tarot/iron-oath.png",
    "assets/ranks/tarot/tempered-will.png",
    "assets/ranks/tarot/quiet-blade.png",
    "assets/ranks/tarot/rooted-resolve.png",
    "assets/ranks/tarot/returned-king.png",
  ];

  for (const asset of requiredAssets) {
    assert.match(html, new RegExp(`src="${asset}"`));
    await access(new URL(`../${asset}`, import.meta.url));
  }
});

test("navigation embeds the Daily Oath logo asset", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");

  assert.match(html, /class="brand-logo" src="assets\/dailyOath-logo\.png"/);
  assert.match(css, /\.brand-logo\s*{[^}]*width:\s*40px/s);
  await access(new URL("../assets/dailyOath-logo.png", import.meta.url));
});

test("footer links to a privacy policy", async () => {
  const html = await read("index.html");

  assert.match(html, /href="privacy-policy.html"/);
  assert.match(html, />Privacy Policy</);
  await access(new URL("../privacy-policy.html", import.meta.url));
});

test("page links the bundled Daily Oath favicon", async () => {
  const html = await read("index.html");

  assert.match(html, /<link rel="icon" href="favicon.ico" sizes="any">/);
  await access(new URL("../favicon.ico", import.meta.url));
});

test("styles preserve the premium static landing page constraints", async () => {
  const css = await read("styles.css");

  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /--ease-out-premium:/);
  assert.match(css, /@media \(max-width:\s*768px\)/);
  assert.match(css, /max-width:\s*100%/);
  assert.match(css, /height:\s*auto/);
  assert.doesNotMatch(css, /font-family:\s*Inter/);
  assert.doesNotMatch(css, /h-screen/);
});

test("closing notification form captures download interest", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");

  assert.match(html, /class="notify-form"/);
  assert.match(html, /action="\/api\/notify"/);
  assert.match(html, /type="email"/);
  assert.match(html, /Notify me/);
  assert.match(html, /role="status"/);
  assert.match(css, /\.notify-form\s*{[^}]*width:\s*min\(100%, 470px\)/s);
  assert.match(css, /\.notify-form\s*{[^}]*justify-self:\s*end/s);
});

test("ritual section keeps enough bottom padding around feature copy", async () => {
  const css = await read("styles.css");

  assert.match(css, /\.experience-field\s*{[^}]*min-height:\s*700px/s);
  assert.match(css, /\.feature-list\s*{[^}]*padding-bottom:\s*96px/s);
});

test("cta buttons render a visible arrow icon inside the icon island", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");

  assert.match(html, /<svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24"/);
  assert.match(html, /<path d="M5 12h12m-5-5 5 5-5 5"/);
  assert.match(css, /\.cta \.arrow-island/);
  assert.doesNotMatch(css, /\.arrow-icon::before/);
  assert.doesNotMatch(css, /\.arrow-icon::after/);
});

test("node server saves valid notification emails and protects the local jsonl list", async () => {
  const notifyDataDir = await mkdtemp(join(tmpdir(), "daily-oath-www-"));
  const server = createAppServer({ notifyDataDir });
  const baseUrl = await listen(server);

  try {
    const validResponse = await fetch(`${baseUrl}/api/notify`, {
      method: "POST",
      body: new URLSearchParams({ email: " Person@Example.COM " }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    assert.equal(validResponse.status, 200);

    const saved = await readFile(join(notifyDataDir, "notify-list.jsonl"), "utf8");
    const savedEntry = JSON.parse(saved.trim());

    assert.equal(savedEntry.email, "person@example.com");
    assert.match(savedEntry.createdAt, /^\d{4}-\d{2}-\d{2}T/);

    const invalidResponse = await fetch(`${baseUrl}/api/notify`, {
      method: "POST",
      body: new URLSearchParams({ email: "not-an-email" }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    assert.equal(invalidResponse.status, 400);

    const leakedListResponse = await fetch(`${baseUrl}/.notify-data/notify-list.jsonl`);
    assert.equal(leakedListResponse.status, 403);

    const serverSourceResponse = await fetch(`${baseUrl}/server.js`);
    assert.equal(serverSourceResponse.status, 404);
  } finally {
    await close(server);
  }
});

test("notification form script restores the success message after a failed submit", async () => {
  const script = await read("script.js");
  const packageJson = await read("package.json");

  assert.match(script, /notifySuccessText/);
  assert.match(script, /notifyErrorText/);
  assert.match(script, /successMessage\.textContent = notifySuccessText/);
  assert.match(script, /successMessage\.classList\.remove\("is-error"\)/);
  assert.match(script, /notifyForm\.classList\.remove\("is-submitted"\)/);
  assert.match(packageJson, /"start":\s*"node server\.js"/);
});

test("only the failed notification message uses bold italic styling", async () => {
  const css = await read("styles.css");

  assert.match(css, /\.notify-success\.is-error\s*{[^}]*font-style:\s*italic/s);
  assert.match(css, /\.notify-success\.is-error\s*{[^}]*font-weight:\s*900/s);
  assert.doesNotMatch(css, /\.notify-note,\s*\.notify-success\s*{[^}]*font-style:\s*italic/s);
});
