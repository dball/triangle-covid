import * as csv from "csv/sync";
import * as fs from "node:fs/promises";

export const config: Config = {
  source: "source/Viral Gene Copies Persons-COVID.csv",
  regions: new Map(
    Object.entries({
      "Durham, Chapel Hill": new Set(["Orange", "Durham"]),
      Raleigh: new Set(["Wake"]),
      Triangle: new Set(["Orange", "Durham", "Wake"]),
    })
  ),
  dest: "summaries",
  maxViralGeneCopiesPerPerson: 800000000,
};

export interface Config {
  source: string;
  regions: Map<string, Set<string>>;
  dest: string;
  maxViralGeneCopiesPerPerson: number;
}

export const parse = (data: string): Array<Record> => {
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
        case "population_served":
        case "Viral Gene Copies Per Person":
          return Number(value.replace(/,/g, ""));
        default:
          return value;
      }
    },
  });
};

export const filter = (
  config: Config,
  records: Array<Record>
): Array<Record> => {
  return records.filter(
    (record) =>
      record["Viral Gene Copies Per Person"] <
      config.maxViralGeneCopiesPerPerson
  );
};

export interface Record {
  Index: unknown;
  County: string;
  Date: string;
  "Wastewater Treatment Plant": string;
  "population_served": number;
  "Viral Gene Copies Per Person": number;
}

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
    const population = record["population_served"];
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
  const data = await fs.readFile(config.source, { encoding: "utf16le" });
  const records = filter(config, parse(data));
  for (const [region, counties] of config.regions) {
    const summary = summarize(counties, records);
    const output = csv.stringify(summary, { header: true });
    await fs.writeFile(`summaries/${region}.csv`, output);
  }
};

if (require.main === module) {
  main();
}
