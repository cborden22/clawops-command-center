import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const id = process.argv[2];
const out = process.argv[3];
const frames = (process.argv[4] ?? "0").split(",").map(Number);

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});
const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });

for (const f of frames) {
  await renderStill({
    composition,
    serveUrl: bundled,
    output: out.replace("%f", String(f)),
    frame: f,
    puppeteerInstance: browser,
    overwrite: true,
  });
  console.log("still", f);
}
await browser.close({ silent: false });
