import * as DataTrue from "@datatrue/api";
import { getTokens } from "./getTokens";

async function asyncEvery(
  arr: any[],
  callback: (value: any, index: number, array: any[]) => unknown
): Promise<boolean> {
  for (const [i, v] of arr.entries()) {
    if (!await callback(v, i, arr)) {
      return false;
    }
  }

  return true;
}

export async function run(): Promise<void> {
  getTokens();

  var base = SpreadsheetApp.getActive().getActiveRange().getRow();

  // Get table dimensions
  for (var width = 0; SpreadsheetApp.getActive().getRange(`R${base}C${width + 1}`).getBackground() !== "#ffffff" && width < 20; width++) {
    // do nothing
  }

  var suiteIds: string[] = SpreadsheetApp.getActive().getRange(`R${base + 2}C3:R${base + 2}C${width}`).getDisplayValues()[0];
  var runStatus = SpreadsheetApp.getActive().getRange(`R${base + 4}C3:R${base + 4}C${width}`);

  const suites: DataTrue.Suite[] = [];

  for (const suiteId of suiteIds) {
    const suite = await DataTrue.Suite.fromID(parseInt(suiteId));
    await suite.run();
    suites.push(suite);
  }

  const status: {
    state: string,
    background: string
  }[] = [];

  suites.forEach(() => {
    status.push({
      state: "Starting",
      background: "#c9daf8",
    });
  });

  while (true) {
    const progresses = await Promise.all(suites.map(suite => suite.progress()));

    for (const [index, progress] of progresses.entries()) {
      if (progress.status !== "completed") {
        status[index].state = progress.progress ? (progress.progress.percentage + "%") : progress.status;
      } else {
        if (progress.progress.tests.every(t => {
          return (t.state === "validated" || t.state === "success");
        })) {
          status[index].state = "Validated";
          status[index].background = "#b6d7a8";
        } else {
          status[index].state = "Failed";
          status[index].background = "#ea9999";
        }
      }
    }

    // Update status in sheet
    runStatus.setValues([status.map(s => {
      return (s.state);
    })]);

    runStatus.setBackgrounds([status.map(s => {
      return (s.background);
    })]);

    SpreadsheetApp.flush();

    if (progresses.every(progress => {
      return (progress.status === "completed" || progress.status === "aborted");
    })) {
      break;
    }

    Utilities.sleep(1000);
  }
}
