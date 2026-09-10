import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5173/#";
const errors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--window-size=1400,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console.error] ${m.text()}`);
});

async function go(hash, name) {
  await page.goto(BASE + hash, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `scripts/shot-${name}.png` });
  console.log(`visited ${hash || "/"} -> ${name}`);
}

await go("/", "dashboard");
await go("/setup", "setup");

// configure the run
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  btns.find((b) => b.textContent.includes("Upload Model"))?.click();
  btns.find((b) => b.textContent.includes("Upload Dataset"))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  btns.find((b) => b.textContent.includes("Use example"))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: "scripts/shot-setup-filled.png" });

await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.includes("Start Agentic Test"))
    ?.click();
});
await new Promise((r) => setTimeout(r, 800));

// skip to end
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.includes("Skip to end"))
    ?.click();
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "scripts/shot-testing-done.png" });

await go("/analysis", "analysis");
await go("/mr", "mr");
await go("/results", "results");
await go("/violations", "violations");
await go("/report", "report");

await browser.close();

if (errors.length) {
  console.log("\n--- RUNTIME ERRORS ---");
  console.log([...new Set(errors)].join("\n"));
  process.exit(1);
}
console.log("\nNo runtime errors.");
