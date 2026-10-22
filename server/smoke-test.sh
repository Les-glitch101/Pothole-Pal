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

# 10. field teams: login, claim a report, move progress, staff sees the state
TM=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"teama@staff.com","password":"team123"}')
TTOK=$(echo "$TM" | py "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
check "team login returns token" "${TTOK:+yes}" "yes"
check "team login lands on role team" "$(echo "$TM" | py "import sys,json;print(json.load(sys.stdin).get('user',{}).get('role',''))" 2>/dev/null)" "team"

TME=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/teams/status" -X POST \
  -H "Authorization: Bearer $RTOK" -H 'Content-Type: application/json' \
  -d '{"status":"onsite","reportId":1025}')
check "resident cannot set team status" "$TME" "403"

SET=$(curl -s -X POST "$BASE/teams/status" -H "Authorization: Bearer $TTOK" \
  -H 'Content-Type: application/json' -d '{"status":"onsite","reportId":1025}')
check "team claims report 1025 as on site" "$(echo "$SET" | py "import sys,json;d=json.load(sys.stdin);print(d.get('reportId',''))" 2>/dev/null)" "1025"

TEAMS=$(curl -s "$BASE/teams" -H "Authorization: Bearer $STOK")
check "staff sees Team A on site at 1025" "$(echo "$TEAMS" | py "
import sys,json
d=json.load(sys.stdin)
t=[x for x in d if x['name']=='Team A']
print(t and (t[0]['status'], t[0]['reportId']) == ('onsite', 1025) or '')" 2>/dev/null)" "True"

# One report, one crew: Team B trying to claim 1025 gets 409.
TB=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"teamb@staff.com","password":"team123"}')
BTOK=$(echo "$TB" | py "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
CLASH=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/teams/status" \
  -H "Authorization: Bearer $BTOK" -H 'Content-Type: application/json' \
  -d '{"status":"onsite","reportId":1025}')
check "second crew on same report gets 409" "$CLASH" "409"

TPATCH=$(curl -s -X PATCH "$BASE/reports/1025" -H "Authorization: Bearer $TTOK" \
  -H 'Content-Type: application/json' -d '{"status":"scheduled","note":"Team A on the way."}')
check "team advances report 1025 to scheduled" "$(echo "$TPATCH" | py "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null)" "scheduled"

# On site at 1025 but trying to move a different report: refused.
OFFSITE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/reports/1024" \
  -H "Authorization: Bearer $TTOK" -H 'Content-Type: application/json' -d '{"status":"scheduled"}')
check "on site elsewhere cannot move another report" "$OFFSITE" "403"

BACK=$(curl -s -X POST "$BASE/teams/status" -H "Authorization: Bearer $TTOK" \
  -H 'Content-Type: application/json' -d '{"status":"available"}')
check "team stands down to available" "$(echo "$BACK" | py "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null)" "available"

# Available now: moving any progress must be refused.
STAND=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/reports/1025" \
  -H "Authorization: Bearer $TTOK" -H 'Content-Type: application/json' -d '{"status":"repairing"}')
check "available crew cannot advance progress" "$STAND" "403"

STATS2=$(curl -s "$BASE/staff/stats" -H "Authorization: Bearer $TTOK")
check "team can read the stats" "$(echo "$STATS2" | py "import sys,json;print(json.load(sys.stdin).get('total',0) > 0)" 2>/dev/null)" "True"
check "stats include monthly history" "$(echo "$STATS2" | py "import sys,json;print(len(json.load(sys.stdin).get('monthly',[])))" 2>/dev/null)" "6"

# 11. attach supporting evidence to the duplicate instead of a second work item
EV=$(curl -s -X POST "$BASE/reports/1025/evidence" -H "Authorization: Bearer $RTOK" \
  -F "photo=@public/logo-96.png;type=image/png")
check "evidence photo attached" "$(echo "$EV" | py "import sys,json;e=json.load(sys.stdin).get('evidence','');print(e.startswith('/uploads/'))" 2>/dev/null)" "True"
check "still exactly 98 reports (no second work item)" "$(curl -s "$BASE/reports" -H "Authorization: Bearer $RTOK" | py "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)" "98"

# 12. ranks, badges and the leaderboard. Alex seeds with 1250 points (Road
# Warrior, level 3); closing report 1025 pays +50.
FIX=$(curl -s -X PATCH "$BASE/reports/1025" -H "Authorization: Bearer $STOK" \
  -H 'Content-Type: application/json' -d '{"status":"fixed"}')
check "staff closes report 1025" "$(echo "$FIX" | py "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null)" "fixed"

ME3=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $RTOK")
check "fixed report pays 50 points (1250 to 1300)" "$(echo "$ME3" | py "import sys,json;print(json.load(sys.stdin).get('stats',{}).get('points',0))" 2>/dev/null)" "1300"
check "auth/me returns a rank title" "$(echo "$ME3" | py "import sys,json;print(json.load(sys.stdin).get('rank',{}).get('title',''))" 2>/dev/null)" "Road Warrior"
check "rank level follows the ladder" "$(echo "$ME3" | py "import sys,json;print(json.load(sys.stdin).get('rank',{}).get('level',0))" 2>/dev/null)" "3"
check "first report badge earned" "$(echo "$ME3" | py "
import sys,json
b=json.load(sys.stdin).get('badges',[])
f=[x for x in b if x['key']=='first_report']
print(bool(f and f[0].get('earned')))" 2>/dev/null)" "True"
check "veteran badge still locked at 1 report" "$(echo "$ME3" | py "
import sys,json
b=json.load(sys.stdin).get('badges',[])
v=[x for x in b if x['key']=='veteran']
print(bool(v and v[0].get('earned')))" 2>/dev/null)" "False"
check "top reporter badge earned on points" "$(echo "$ME3" | py "
import sys,json
b=json.load(sys.stdin).get('badges',[])
t=[x for x in b if x['key']=='top_reporter']
print(bool(t and t[0].get('earned')))" 2>/dev/null)" "True"

LB=$(curl -s "$BASE/leaderboard" -H "Authorization: Bearer $RTOK")
check "leaderboard ranked by points, Alex first" "$(echo "$LB" | py "import sys,json;d=json.load(sys.stdin);print(d['top'][0]['name'] if d.get('top') else '')" 2>/dev/null)" "Alex R."
check "leaderboard positions run 1 to 4" "$(echo "$LB" | py "import sys,json;d=json.load(sys.stdin);print([r['position'] for r in d.get('top',[])])" 2>/dev/null)" "[1, 2, 3, 4]"
check "second place shows their own rank title" "$(echo "$LB" | py "import sys,json;d=json.load(sys.stdin);print(d['top'][1]['title'] if len(d.get('top',[]))>1 else '')" 2>/dev/null)" "Road Spotter"
check "Alex sits at position 1 of 4" "$(echo "$LB" | py "import sys,json;m=json.load(sys.stdin).get('me',{});print(f\"{m.get('position',0)} of {m.get('total',0)}\")" 2>/dev/null)" "1 of 4"

echo
if [ "$fail" -eq 0 ]; then echo "ALL SMOKE TESTS PASSED"; else echo "SMOKE TESTS FAILED"; fi
exit "$fail"
