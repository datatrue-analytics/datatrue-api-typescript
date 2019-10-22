#!/bin/env bash

JOB_ID = `curl -s \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --reqeust POST \
  --data '{"test_run":{"test_class":"$DATATRUE_TEST_CLASS","test_id":"$DATATRUE_TEST_ID","email_users":"$DATATRUE_EMAIL_USERS","variables":$DATATRUE_VARIABLES}}' \
  https://datatrue.com/ci_api/test_runs?api_key=$DATATRUE_API_KEY | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])"`

STATUS = `curl -s \
  --header "Accept: application/json" \
  --header "Content-Type: application/json"
  --request GET \
  https://datatrue.com/ci_api/test_runs/progress/$JOB_ID?api_key=$DATATRUE_API_KEY`

echo $STATUS
