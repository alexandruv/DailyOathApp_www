import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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
  assert.match(html, /Download Daily Oath/);
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

  assert.match(html, /aria-label="Daily Oath mobile app preview"/);
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

test("closing download button stays compact instead of stretching", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");

  assert.match(html, /class="cta primary closing-cta"/);
  assert.match(css, /\.closing-cta\s*{[^}]*width:\s*fit-content/s);
  assert.match(css, /\.closing-cta\s*{[^}]*justify-self:\s*end/s);
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
