// Low-token screenshots over the Chrome DevTools Protocol (no MCP, no npm deps; Node ≥ 22).
// usage: node tools/shot.mjs <url> <name> [cssSelectorToScrollTo] [offsetPx] [width] [height] [dark|light]
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
const [url, name, sel = "", off = "0", W = "390", H = "844", scheme = "light"] = process.argv.slice(2);
const OUT = process.env.SHOT_DIR || "shots";   // set SHOT_DIR to save elsewhere
mkdirSync(OUT, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", `--user-data-dir=/tmp/shot-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) { await sleep(150);
  try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} }
await new Promise((r) => (ws.onopen = r));
let id = 0; const wait = new Map();
const errs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d.result); wait.delete(d.id); }
  if (d.method === "Runtime.exceptionThrown") errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 160));
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errs.push(d.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 160));
  if (d.method === "Log.entryAdded" && d.params.entry.level === "error") errs.push(d.params.entry.text.slice(0, 160) + " " + (d.params.entry.url || "")); };
const cdp = (method, params = {}) => new Promise((r) => { wait.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await cdp("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 700 });
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Page.enable"); await cdp("Page.navigate", { url });
await sleep(2500);
if (sel) await cdp("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:"start"}); scrollBy(0, ${+off});` });
await sleep(2500);
const r = await cdp("Runtime.evaluate", { expression: "JSON.stringify({y:scrollY,w:document.documentElement.scrollWidth})", returnByValue: true });
const shot = await cdp("Page.captureScreenshot", { format: "jpeg", quality: 45 });
await writeFile(`${OUT}/${name}.jpg`, Buffer.from(shot.data, "base64"));
console.log(`${OUT}/${name}.jpg`, r.result.value, errs.length ? "ERRORS: " + JSON.stringify(errs) : "no console errors");
ws.close(); chrome.kill();
