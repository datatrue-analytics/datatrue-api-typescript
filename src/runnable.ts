import config from "./config";

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

  /**
   * Run the resource in DataTrue
   *
   * @param email_users an array of user IDs to whom the test results should be sent
   * @param variables variables to set for the test run
   * @returns Promise of the jobID
   */
  run(email_users?: number[], variables?: Record<string, any>): Promise<string>,

  /**
   * Retrieve the JobStatus for a resource
   *
   * @returns Promise of the JobStatus
   */
  progress(): Promise<JobStatus>,
}

/**
 * Run the resource in DataTrue
 *
 * @param emailUsers a list of IDs for who should be emailed regarding the test run
 * @param variables variables to set for the test run
 * @param resourceTypeRun the type of the resource being run
 * @param resourceID the ID of the resource to run
 * @returns Promise of the job_id
 */
export async function _run(
  emailUsers: number[] = [],
  variables: Record<string, string>,
  resourceTypeRun: string,
  resourceID: number,
): Promise<string> {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    "test_runs",
  ].join("/");

  const response = await config.httpClient.makeRequest(uri, "post", {
    headers: {
      "authorization": "Token " + config.userToken,
    },
    body: JSON.stringify({
      "test_run": {
        "test_class": resourceTypeRun,
        "test_id": resourceID,
        "email_users": emailUsers,
      },
      variables: variables,
    }),
  });

  if (response.status >= 400) {
    throw new Error(response.body);
  }

  return JSON.parse(response.body)["job_id"];
}

/**
 * Retrieve progress for a job
 *
 * @param jobID ID of the job to fetch progress for
 * @returns Promise of the job status
 */
export async function _progress(
  jobID: string,
): Promise<JobStatus> {
  const uri = [
    config.apiEndpoint,
    "ci_api",
    "test_runs",
    "progress",
    jobID,
  ].join("/");

  const response = await config.httpClient.makeRequest(uri, "get", {
    headers: {
      "authorization": "Token " + config.userToken,
    },
  });

  if (response.status >= 400) {
    throw new Error(response.body);
  }

  return JSON.parse(response.body);
}
