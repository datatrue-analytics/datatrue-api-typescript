import { config } from "./index";
import { _makeRequest } from "./_resource";

export interface JobStatus {
  status: string,
  options: {
    test_run_id: number,
  },
  num?: number,
  total?: number,
  progress?: {
    percentage: number,
    tests: {
      test_result_id: number,
      id: number,
      name: string,
      state: string,
      running: boolean,
      steps_completed: number,
      pii: {
        num_pii_exposure: number,
        num_pii_data_types: number,
        num_pii_data_processors: number,
      },
    }[],
  },
  message?: string,
}

export default interface Runnable {
  jobID: number,

  run(email_users: number[]): void,
  progress(): JobStatus,
}

/**
 * Run the resource in DataTrue
 *
 * @param {number[]} [email_users=[]] a list of IDs for who should be emailed regarding the test run
 * @param {string} resourceTypeRun the type of the resource being run
 * @param {number} resourceID the ID of the resource to run
 * @returns {number} the ID of the job that was created
 */
export const _run = function _run(email_users: number[] = [], resourceTypeRun: string, resourceID: number): number {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    `test_runs?api_key=${config.ciToken}`,
  ].join("/");

  const request = _makeRequest("post", uri, JSON.stringify({
    "test_run": {
      "test_class": resourceTypeRun,
      "test_id": resourceID,
      "email_users": email_users,
    },
  }));

  return JSON.parse(request.getContentText())["job_id"];
};

/**
 * Retrieve the progress of a running test
 *
 * @param {number} jobID ID of the job to fetch progress for
 * @returns {JobStatus} the status of the running test
 */
export const _progress = function _progress(jobID: number): JobStatus {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    "test_runs",
    "progress",
    `${jobID}?api_key=${config.ciToken}`,
  ].join("/");

  const options = {
    "method": "get" as GoogleAppsScript.URL_Fetch.HttpMethod,
    "contentType": "application/json",
    "headers": {
      "content-type": "application/json",
    },
  };

  return JSON.parse(UrlFetchApp.fetch(uri, options).getContentText());
};
