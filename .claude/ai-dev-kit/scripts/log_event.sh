#!/usr/bin/env bash
# Log event to JSONL run log
# Usage: log_event.sh LOG_PATH RUN_ID PHASE_ID LANE_ID TASK_ID EVENT STATUS [CMD] [EXIT_CODE] [NOTES]

set -euo pipefail

LOG_PATH="${1:-}"
RUN_ID="${2:-}"
PHASE_ID="${3:-}"
LANE_ID="${4:-}"
TASK_ID="${5:-}"
EVENT="${6:-}"
STATUS="${7:-}"
CMD="${8:-}"
EXIT_CODE="${9:-}"
NOTES="${10:-}"

if [[ -z "$LOG_PATH" || -z "$RUN_ID" || -z "$PHASE_ID" || -z "$LANE_ID" || -z "$EVENT" || -z "$STATUS" ]]; then
  echo "ERROR: Missing required arguments" >&2
  echo "Usage: log_event.sh LOG_PATH RUN_ID PHASE_ID LANE_ID TASK_ID EVENT STATUS [CMD] [EXIT_CODE] [NOTES]" >&2
  exit 1
fi

# Generate UTC timestamp
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build JSON event
jq -n \
  --arg ts "$TS" \
  --arg run_id "$RUN_ID" \
  --arg phase "$PHASE_ID" \
  --arg lane "$LANE_ID" \
  --arg task "$TASK_ID" \
  --arg event "$EVENT" \
  --arg status "$STATUS" \
  --arg cmd "$CMD" \
  --arg exit_code "$EXIT_CODE" \
  --arg notes "$NOTES" \
  '{
    ts: $ts,
    run_id: $run_id,
    phase: $phase,
    lane: $lane,
    task: $task,
    event: $event,
    status: $status
  } + (if $cmd != "" then {cmd: $cmd} else {} end)
    + (if $exit_code != "" then {exit_code: ($exit_code | tonumber)} else {} end)
    + (if $notes != "" then {notes: $notes} else {} end)' >> "$LOG_PATH"
