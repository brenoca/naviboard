#!/bin/bash
# Integration tests for /api/habits endpoint
# Usage: bash tests/test_habits_api.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3333}"
COOKIE="navi_auth=$(grep DASHBOARD_SECRET /home/ubuntu/.openclaw/workspace/navi-dashboard/.env.local | cut -d= -f2)"
TODAY=$(date -u +%Y-%m-%d)
PASS=0
FAIL=0

# ── Helpers ──────────────────────────────────────────────────────────

post() {
  curl -s -X POST -b "$COOKIE" "$BASE_URL/api/habits" \
    -H "Content-Type: application/json" -d "$1"
}

get() {
  curl -s -b "$COOKIE" "$BASE_URL/api/habits$1"
}

assert_eq() {
  local desc="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc (expected '$expected', got '$actual')"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local desc="$1" actual="$2" expected="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc (expected to contain '$expected')"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Habits API Tests ==="
echo ""

# ── Test 1: POST without action returns error ────────────────────────
echo "1. POST without action"
RESP=$(post '{"habit_id": 1, "date": "'"$TODAY"'", "value": 1}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
assert_eq "returns ok=false" "$STATUS" "False"
assert_contains "has error message" "$RESP" "Missing or invalid"
assert_contains "shows valid_actions" "$RESP" "valid_actions"
assert_contains "shows example_log" "$RESP" "example_log"

echo ""

# ── Test 2: POST with action=log but no habit_id ─────────────────────
echo "2. POST action=log without habit_id"
RESP=$(post '{"action": "log", "date": "'"$TODAY"'", "value": 1}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
assert_eq "returns ok=false" "$STATUS" "False"
assert_contains "mentions habit_id" "$RESP" "habit_id"

echo ""

# ── Test 3: POST action=create without name ──────────────────────────
echo "3. POST action=create without name"
RESP=$(post '{"action": "create"}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
assert_eq "returns ok=false" "$STATUS" "False"
assert_contains "mentions name" "$RESP" "name"

echo ""

# ── Test 4: Valid log ─────────────────────────────────────────────────
echo "4. POST valid habit log"
RESP=$(post '{"action": "log", "habit_id": 1, "date": "'"$TODAY"'", "value": 1}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
assert_eq "returns ok=true" "$STATUS" "True"

echo ""

# ── Test 5: Valid create ──────────────────────────────────────────────
echo "5. POST create new habit"
RESP=$(post '{"action": "create", "name": "_test_habit_", "icon": "🧪"}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
NEW_ID=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))")
assert_eq "returns ok=true" "$STATUS" "True"
assert_contains "returns habit id" "$RESP" "id"

echo ""

# ── Test 6: GET returns habits ────────────────────────────────────────
echo "6. GET habits list"
RESP=$(get "")
HABIT_COUNT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('habits',[])))")
assert_contains "returns habits array" "$RESP" "habits"
assert_contains "returns logs array" "$RESP" "logs"

echo ""

# ── Test 7: Log with value=0 removes log ─────────────────────────────
echo "7. POST log value=0 removes entry"
# First log it
post '{"action": "log", "habit_id": '"$NEW_ID"', "date": "'"$TODAY"'", "value": 1}' > /dev/null
# Then remove it
RESP=$(post '{"action": "log", "habit_id": '"$NEW_ID"', "date": "'"$TODAY"'", "value": 0}')
STATUS=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ok',''))")
assert_eq "returns ok=true" "$STATUS" "True"
# Verify it's gone
LOGS=$(get "" | python3 -c "import json,sys; d=json.load(sys.stdin); logs=[l for l in d['logs'] if l['habit_id']==$NEW_ID and l['date']=='$TODAY']; print(len(logs))")
assert_eq "log entry removed" "$LOGS" "0"

echo ""

# ── Cleanup: delete test habit ────────────────────────────────────────
echo "Cleanup..."
curl -s -X DELETE -b "$COOKIE" "$BASE_URL/api/habits" \
  -H "Content-Type: application/json" -d '{"id": '"$NEW_ID"'}' > /dev/null
echo "  Deleted test habit (id=$NEW_ID)"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
