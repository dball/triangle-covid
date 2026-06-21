import * as csv from "csv/sync";
import * as fs from "node:fs/promises";
import sharp from "sharp";
import { config } from "./convert";

// vega and vega-lite are ESM-only, so load them via dynamic import from this
// CommonJS module rather than a static require. We avoid static type imports
// from them too, since under nodenext resolution any static reference from a
// CommonJS module is flagged as an illegal require of an ESM module.
const loadVega = () => import("vega");
const loadVegaLite = () => import("vega-lite");

interface Summary {
  date: string;
  virusesPerPerson: number;
}

export const parseSummary = (data: string): Array<Summary> => {
  return csv.parse(data, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      switch (context.column) {
        case "virusesPerPerson":
          return Number(value);
        default:
          return value;
      }
    },
  });
};

export const spec = (region: string, rows: Array<Summary>) => {
  const blue = "#4285f4";
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    width: 560,
    height: 290,
    title: {
      text: `Viral Particles Per Person: ${region}`,
      anchor: "start",
      color: "#5f6368",
      fontWeight: "normal",
      fontSize: 18,
    },
    data: { values: rows },
    layer: [
      {
        mark: { type: "line", color: blue, strokeWidth: 1 },
        encoding: {
          x: {
            field: "date",
            type: "temporal",
            title: "date",
            axis: { tickCount: "year", format: "%Y" },
          },
          y: {
            field: "virusesPerPerson",
            type: "quantitative",
            title: null,
            scale: { domainMin: 0 },
            axis: {
              labelExpr:
                "datum.value === 0 ? '0' : upper(format(datum.value, '.1e'))",
            },
          },
        },
      },
      {
        transform: [
          { regression: "virusesPerPerson", on: "date", method: "linear" },
        ],
        mark: { type: "line", color: blue, strokeWidth: 1.5, opacity: 0.35 },
        encoding: {
          x: { field: "date", type: "temporal" },
          y: { field: "virusesPerPerson", type: "quantitative" },
        },
      },
    ],
  };
};

export const render = async (
  region: string,
  rows: Array<Summary>
): Promise<string> => {
  const vl = await loadVegaLite();
  const vega = await loadVega();
  const vgSpec = vl.compile(spec(region, rows) as any).spec;
  const view = new vega.View(vega.parse(vgSpec), { renderer: "none" });
  return view.toSVG();
};

// Mirrors the encoding used by the README links: spaces become %20 while the
// comma in "Durham, Chapel Hill" stays literal, which is exactly encodeURI's
// behavior.
const figureBasename = (region: string, date: string): string =>
  `Viral Particles Per Person ${region} ${date}`;

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const updateReadme = async (date: string): Promise<void> => {
  const path = "README.md";
  let readme = await fs.readFile(path, { encoding: "utf8" });
  for (const region of config.regions.keys()) {
    const encoded = encodeURI(`./figures/${figureBasename(region, date)}.svg`);
    // Match this region's existing link regardless of its prior date.
    const prefix = encodeURI(
      `./figures/Viral Particles Per Person ${region} `
    );
    const pattern = new RegExp(
      `\\(${escapeRegExp(prefix)}\\d{4}-\\d{2}-\\d{2}\\.svg\\)`
    );
    readme = readme.replace(pattern, `(${encoded})`);
  }
  await fs.writeFile(path, readme);
};

export const main = async () => {
  let latestDate = "";
  for (const region of config.regions.keys()) {
    const data = await fs.readFile(`${config.dest}/${region}.csv`, {
      encoding: "utf8",
    });
    const rows = parseSummary(data);
    const date = rows.reduce((max, r) => (r.date > max ? r.date : max), "");
    if (date > latestDate) {
      latestDate = date;
    }
    const svg = await render(region, rows);
    const base = `figures/${figureBasename(region, date)}`;
    await fs.writeFile(`${base}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`${base}.png`);
    console.log(`Wrote ${base}.svg and ${base}.png`);
  }
  await updateReadme(latestDate);
  console.log(`Updated README links to ${latestDate}`);
};

if (require.main === module) {
  main();
}
