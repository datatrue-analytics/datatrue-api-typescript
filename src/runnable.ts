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
  jobID?: string,

  run(email_users: number[]): Promise<string>,
  progress(): Promise<JobStatus>,
}

/**
 * Run the resource in DataTrue
 *
 * @hidden
 * @param {number[]} [email_users=[]] a list of IDs for who should be emailed regarding the test run
 * @param {string} resourceTypeRun the type of the resource being run
 * @param {number} resourceID the ID of the resource to run
 * @param {HTTPClient} client client to make the HTTP request
 * @param {Config} config config
 * @returns {Promise<string>} Promise of the job_id
 */
export function _run(email_users: number[] = [], resourceTypeRun: string, resourceID: number, client: HTTPClient, config: Config): Promise<string> {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    `test_runs?api_key=${config.accountToken}`,
  ].join("/");

  return client.makeRequest(uri, "post", {
    body: JSON.stringify({
      "test_run": {
        "test_class": resourceTypeRun,
        "test_id": resourceID,
        "email_users": email_users,
      },
    }),
  }).then(response => {
    return JSON.parse(response.body)["job_id"];
  });
}

/**
 * Retrieve progress for a job
 *
 * @hidden
 * @param {number} jobID ID of the job to fetch progress for
 * @param {HTTPClient} client client to make the HTTP request
 * @param {Config} config config
 * @returns {Promise<JobStatus>} Promise of the job status
 */
export function _progress(jobID: string, client: HTTPClient, config: Config): Promise<JobStatus> {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    "test_runs",
    "progress",
    `${jobID}?api_key=${config.accountToken}`,
  ].join("/");

  return client.makeRequest(uri, "get", { }).then(response => {
    return JSON.parse(response.body);
  });
}
