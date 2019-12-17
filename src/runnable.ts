import HTTPClient from "./httpClient/httpClient";
import { Config } from "./resource";

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
  jobID?: number,

  run(email_users: number[]): void,
  progress(callback: (jobStatus: JobStatus) => void, thisArg: any): void, // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Run the resource in DataTrue
 *
 * @param {number[]} [email_users=[]] a list of IDs for who should be emailed regarding the test run
 * @param {string} resourceTypeRun the type of the resource being run
 * @param {number} resourceID the ID of the resource to run
 * @param {HTTPClient} client client to make the HTTP request
 * @param {Config} config config
 * @param {(jobID: number) => void} [callback] callback to execute once the resource has been run
 * @param {*} [thisArg] the context to execute the callback in
 */
export function _run(email_users: number[] = [], resourceTypeRun: string, resourceID: number, client: HTTPClient, config: Config, callback?: (jobID: number) => void, thisArg?: any): void {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    `test_runs?api_key=${config.ciToken}`,
  ].join("/");

  client.makeRequest(uri, "post", {
    body: JSON.stringify({
      "test_run": {
        "test_class": resourceTypeRun,
        "test_id": resourceID,
        "email_users": email_users,
      },
    }),
    headers: {
      "content-type": "application/json",
    },
  }, (response) => {
    if (typeof callback === "function") {
      callback.call(thisArg, JSON.parse(response.body)["job_id"]);
    }
  });
}

/**
 * Retrieve progress for a job
 *
 * @param {number} jobID ID of the job to fetch progress for
 * @param {HTTPClient} client client to make the HTTP request
 * @param {Config} config config
 * @param {(jobStatus: JobStatus) => void} callback callback to execute once the progress has been retrieved
 * @param {*} thisArg context to execute the callback in
 */
export function _progress(jobID: number, client: HTTPClient, config: Config, callback?: (jobStatus: JobStatus) => void, thisArg?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const uri = [
    config.apiEndpoint,
    "ci_api",
    "test_runs",
    "progress",
    `${jobID}?api_key=${config.ciToken}`,
  ].join("/");

  client.makeRequest(uri, "get", {
    headers: {
      "content-type": "application/json",
    },
  }, (response) => {
    if (typeof callback === "function") {
      callback.call(thisArg, JSON.parse(response.body));
    }
  });
}
