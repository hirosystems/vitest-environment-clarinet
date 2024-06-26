// @ts-check

import fs from "node:fs";
import { initSimnet } from "@hirosystems/clarinet-sdk";

/** @type import("vitest").Environment */
export default {
  name: "clarinet",
  transformMode: "web",
  async setupVM() {
    const nodeVM = await import("node:vm");
    const context = nodeVM.createContext();
    return {
      getVmContext() {
        return context;
      },
      teardown() {},
    };
  },
  async setup(global, options) {
    const covFilename = options.clarinet.coverageFilename || "lcov.info";
    const costsFilename =
      options.clarinet.costsFilename || "costs-reports.json";

    const { coverage, costs } = options.clarinet;

    if (coverage && fs.existsSync(covFilename)) fs.rmSync(covFilename);
    if (costs && fs.existsSync(costsFilename)) fs.rmSync(costsFilename);

    const { manifestPath } = options.clarinet;
    const simnet = await initSimnet(manifestPath, false, {
      trackCosts: costs,
      trackCoverage: coverage,
    });

    global.testEnvironment = "clarinet";
    global.simnet = simnet;
    global.coverageReports = [];
    global.costsReports = [];
    global.options = options;

    return {
      async teardown() {
        if (coverage) {
          fs.writeFileSync(covFilename, global.coverageReports.join("\n"));
        }

        if (costs) {
          try {
            const costs = global.costsReports.map((r) => JSON.parse(r)).flat();
            fs.writeFileSync(costsFilename, JSON.stringify(costs, null, 2));
          } catch (e) {
            console.warn(`Failed to write costs reports file.`);
          }
        }

        delete global.testEnvironment;
        delete global.simnet;
        delete global.coverageReports;
        delete global.costsReports;
        delete global.options;
      },
    };
  },
};
