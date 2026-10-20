#!/usr/bin/env bash
# PotholePal API smoke test.
# With the server running (cd server && npm start), from the project root:
#   bash server/smoke-test.sh
set -u
BASE="http://localhost:3001/api/v1"
fail=0
py() { python -c "$1"; }

check() { # check <name> <actual> <expected>
  if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (got: '$2', want: '$3')"; fail=1; fi
}

# 1. signed out gets 401
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reports")
check "signed out gets 401" "$code" "401"

# 2. logins
RES=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"alex@potholepal.test","password":"resident123"}')
RTOK=$(echo "$RES" | py "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
check "resident login returns token" "${RTOK:+yes}" "yes"

STF=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"staff@potholepal.test","password":"staff123"}')
STOK=$(echo "$STF" | py "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
check "staff login returns token" "${STOK:+yes}" "yes"

BAD=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"alex@potholepal.test","password":"wrong"}')
check "wrong password gets 401" "$BAD" "401"

ME=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $RTOK")
check "me returns Alex R." "$(echo "$ME" | py "import sys,json;print(json.load(sys.stdin).get('name',''))" 2>/dev/null)" "Alex R."

# 3. reports list
REP=$(curl -s "$BASE/reports" -H "Authorization: Bearer $RTOK")
N=$(echo "$REP" | py "import sys,json;d=json.load(sys.stdin);print(len(d))" 2>/dev/null)
check "97 seeded reports listed" "$N" "97"
MINE=$(echo "$REP" | py "
import sys,json
d=json.load(sys.stdin)
r1018=[r for r in d if r['id']==1018]
print(r1018 and r1018[0]['isMine'] or False)" 2>/dev/null)
check "seed report not owned by Alex" "$MINE" "False"

# 4. stats + notifications before submitting
ST=$(curl -s "$BASE/stats" -H "Authorization: Bearer $RTOK")
check "stats total is 97" "$(echo "$ST" | py "import sys,json;print(json.load(sys.stdin)['total'])" 2>/dev/null)" "97"
N0=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $RTOK" | py "import sys,json;print(sum(len(g['items']) for g in json.load(sys.stdin)))" 2>/dev/null)
check "6 seeded notifications" "$N0" "6"

# 5. submit a report (P1 candidate: Large/Deep/High/Yes = score 11)
POST1=$(curl -s -w '\n%{http_code}' -X POST "$BASE/reports" -H "Authorization: Bearer $RTOK" \
  -F "photo=@public/favicon-48.png;type=image/png" \
  -F "lat=-26.71" -F "lng=27.97" \
  -F "address=Vereeniging, Gauteng, South Africa" -F "issueType=Pothole" \
  -F "size=Large" -F "depth=Deep" -F "traffic=High" -F "damage=Yes" \
  -F "description=Smoke test pothole on a fresh spot.")
P1CODE=$(echo "$POST1" | tail -1)
check "POST report returns 201" "$P1CODE" "201"
P1BODY=$(echo "$POST1" | sed '$d')
NEWID=$(echo "$P1BODY" | py "import sys,json;d=json.load(sys.stdin);print(d.get('id',''))" 2>/dev/null)
check "first live report is #1025" "$NEWID" "1025"
check "P1 priority from scoring rule" "$(echo "$P1BODY" | py "import sys,json;print(json.load(sys.stdin).get('priority',''))" 2>/dev/null)" "P1"
check "score stored as number" "$(echo "$P1BODY" | py "import sys,json;print(json.load(sys.stdin).get('score',''))" 2>/dev/null)" "11"
check "new report belongs to the reporter" "$(echo "$P1BODY" | py "import sys,json;print(json.load(sys.stdin).get('isMine',''))" 2>/dev/null)" "True"

# 6. duplicate within 50 m returns 409 with the existing reference
POST2=$(curl -s -w '\n%{http_code}' -X POST "$BASE/reports" -H "Authorization: Bearer $RTOK" \
  -F "photo=@public/favicon-48.png;type=image/png" \
  -F "lat=-26.71" -F "lng=27.97" \
  -F "address=Vereeniging, Gauteng, South Africa" -F "issueType=Pothole" \
  -F "size=Small" -F "depth=Shallow" -F "traffic=Low" -F "damage=No" \
  -F "description=Same pothole reported again.")
P2CODE=$(echo "$POST2" | tail -1)
check "duplicate submit gets 409" "$P2CODE" "409"
check "duplicate returns ref #1025" "$(echo "$POST2" | sed '$d' | py "import sys,json;print(json.load(sys.stdin)['error'].get('ref',''))" 2>/dev/null)" "#1025"

# 7. resident cannot change status, staff can
PC=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/reports/1025" \
  -H "Authorization: Bearer $RTOK" -H 'Content-Type: application/json' -d '{"status":"review"}')
check "resident PATCH gets 403" "$PC" "403"
PATCH=$(curl -s -X PATCH "$BASE/reports/1025" -H "Authorization: Bearer $STOK" \
  -H 'Content-Type: application/json' -d '{"status":"review","note":"Checked for duplicates."}')
check "staff advances status to review" "$(echo "$PATCH" | py "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null)" "review"
check "timeline shows the new stage" "$(echo "$PATCH" | py "import sys,json;print(json.load(sys.stdin)['timeline'][1] is not None)" 2>/dev/null)" "True"

# 8. resident sees the notification created by that status change
NOTIFS=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $RTOK")
check "notifications grew to 8" "$(echo "$NOTIFS" | py "import sys,json;print(sum(len(g['items']) for g in json.load(sys.stdin)))" 2>/dev/null)" "8"
check "verified notification for #1025" "$(echo "$NOTIFS" | py "
import sys,json
g=json.load(sys.stdin)
print(any('1025' in i['title'] and i['icon']=='check' for grp in g for i in grp['items']))" 2>/dev/null)" "True"

# 9. staff queue sorted by priority score, staff stats consistent
Q=$(curl -s "$BASE/staff/queue" -H "Authorization: Bearer $STOK")
check "queue sorted by score descending" "$(echo "$Q" | py "
import sys,json
d=json.load(sys.stdin)
s=[r['score'] for r in d]
print(s==sorted(s, reverse=True))" 2>/dev/null)" "True"
SS=$(curl -s "$BASE/staff/stats" -H "Authorization: Bearer $STOK")
check "staff stats total is 98" "$(echo "$SS" | py "import sys,json;print(json.load(sys.stdin)['total'])" 2>/dev/null)" "98"
check "stats include heatmap points" "$(echo "$SS" | py "import sys,json;print(len(json.load(sys.stdin)['heat'])>0)" 2>/dev/null)" "True"

# 10. attach supporting evidence to the duplicate instead of a second work item
EV=$(curl -s -X POST "$BASE/reports/1025/evidence" -H "Authorization: Bearer $RTOK" \
  -F "photo=@public/logo-96.png;type=image/png")
check "evidence photo attached" "$(echo "$EV" | py "import sys,json;e=json.load(sys.stdin).get('evidence','');print(e.startswith('/uploads/'))" 2>/dev/null)" "True"
check "still exactly 98 reports (no second work item)" "$(curl -s "$BASE/reports" -H "Authorization: Bearer $RTOK" | py "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)" "98"

echo
if [ "$fail" -eq 0 ]; then echo "ALL SMOKE TESTS PASSED"; else echo "SMOKE TESTS FAILED"; fi
exit "$fail"
