import * as csv from "csv/sync";
import * as fs from "node:fs/promises";

export const parse = async (): Promise<Array<Record>> => {
  const data = await fs.readFile("Viral Gene Copies Persons.csv", {
    encoding: "utf16le",
  });
  return csv.parse(data, {
    columns: true,
    delimiter: "\t",
    skip_empty_lines: true,
    cast: (value, context) => {
      switch (context.column) {
        case "Date":
          return new Date(value).toISOString().substring(0, 10);
        case "Index":
          // TODO wtf is this not catching?
          return Number(value);
        case "Population Served":
        case "Viral Gene Copies Per Person":
        case "Viral Gene Copies/L":
          return Number(value.replace(/,/g, ""));
        default:
          return value;
      }
    },
  });
};

export interface Record {
  Index: unknown;
  County: string;
  Date: string;
  "Wastewater Treatment Plant": string;
  "Population Served": number;
  "Viral Gene Copies Per Person": number;
  "Viral Gene Copies/L": number;
}

export const counties = new Set(["Orange", "Durham"]);

export const summarize = (counties: Set<string>, records: Array<Record>) => {
  const populationsBySite: Map<string, number> = new Map();
  const virusesPerPersonByDateThenSite: Map<
    string,
    Map<string, number>
  > = new Map();
  for (const record of records) {
    if (!counties.has(record.County)) {
      continue;
    }
    const population = record["Population Served"];
    if (
      populationsBySite.has(record["Wastewater Treatment Plant"]) &&
      populationsBySite.get(record["Wastewater Treatment Plant"]) != population
    ) {
      throw new Error(
        "Site populations have been updated, this requires better math here."
      );
    }
    populationsBySite.set(record["Wastewater Treatment Plant"], population);
    if (!virusesPerPersonByDateThenSite.has(record.Date)) {
      virusesPerPersonByDateThenSite.set(record.Date, new Map());
    }
    virusesPerPersonByDateThenSite
      .get(record.Date)
      ?.set(
        record["Wastewater Treatment Plant"],
        record["Viral Gene Copies Per Person"]
      );
  }
  const dates = [...virusesPerPersonByDateThenSite.keys()].sort();
  const latestVirusesPerPersonPerSite: Map<string, number> = new Map();
  const output: Array<unknown> = [];
  for (const date of dates) {
    for (const [site, total] of virusesPerPersonByDateThenSite.get(date)!) {
      latestVirusesPerPersonPerSite.set(site, total);
    }
    let observedPopulation = 0;
    for (const site of latestVirusesPerPersonPerSite.keys()) {
      observedPopulation += populationsBySite.get(site)!;
    }
    let totalViruses = 0;
    for (const [
      site,
      virusesPerPerson,
    ] of latestVirusesPerPersonPerSite.entries()) {
      totalViruses += virusesPerPerson * populationsBySite.get(site)!;
    }
    output.push({
      date,
      observedPopulation,
      totalViruses,
      virusesPerPerson: totalViruses / observedPopulation,
    });
  }
  return output;
};

export const main = async () => {
  const records = await parse();
  const summary = summarize(counties, records);
  const data = csv.stringify(summary, { header: true });
  await fs.writeFile("summary.csv", data);
};
