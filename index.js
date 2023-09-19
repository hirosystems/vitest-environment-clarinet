// @ts-check

import fs from "node:fs";
import { initVM } from "@hirosystems/clarinet-sdk";

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
    const covFileName = options.clarinet.coverageFilename || "lcov.info";

    if (options.clarinet.coverage && fs.existsSync(covFileName)) {
      fs.rmSync(covFileName);
    }

    const clarityVM = await initVM();

    global.testEnvironment = "clarinet";
    global.vm = clarityVM;
    global.coverageReports = [];
    global.options = options;

    return {
      async teardown() {
        if (options.clarinet.coverage) {
          fs.writeFileSync(covFileName, global.coverageReports.join("\n"));
        }

        delete global.testEnvironment;
        delete global.vm;
        delete global.coverageReports;
        delete global.options;
      },
    };
  },
};
