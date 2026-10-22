"""Build docs/PotholePal-day4-portals.docx.

Re-run after editing the content below:  python docs/build_day4_docx.py
"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches

BLUE = RGBColor(0x1D, 0x5B, 0xEB)
GREY = RGBColor(0x64, 0x74, 0x8B)

doc = Document()

normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)


def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        run = hdr[i].paragraphs[0].add_run(h)
        run.bold = True
        run.font.size = Pt(10)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            run = cells[i].paragraphs[0].add_run(str(val))
            run.font.size = Pt(10)
    if widths:
        for r in t.rows:
            for i, w in enumerate(widths):
                r.cells[i].width = Inches(w)
    doc.add_paragraph()
    return t


def bullets(items):
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def numbered(items):
    for item in items:
        doc.add_paragraph(item, style="List Number")


def note(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.italic = True
    run.font.color.rgb = GREY
    run.font.size = Pt(10)


# ---------------------------------------------------------------- title
title = doc.add_heading("PotholePal day 4: the Staff Portal and the field-team portals", level=0)
title.runs[0].font.color.rgb = BLUE
sub = doc.add_paragraph()
run = sub.add_run("Thursday 22 October 2026  ·  The City Fix Team (Lesiamo, Crystal, Kgosi, Raymond)")
run.font.color.rgb = GREY
run.font.size = Pt(10)

doc.add_paragraph(
    "Yesterday the office dashboard had four problems and one big gap. The reports sat "
    "in a random order, the Analytics tab showed nothing, the notification button did "
    "nothing, and the menu button in the top-left corner logged staff out with a single "
    "click instead of opening a menu. The big gap: moving a report's progress was the "
    "staff's job, when it belongs to the crews actually doing the repair. This document "
    "records what changed, why, and how it was tested."
)

# ---------------------------------------------------------------- 1
doc.add_heading("1. What the office asked for, and what we did", level=1)
table(
    ["Asked for", "What we built"],
    [
        [
            "Reports listed from first to most recent, with fixed ones at the bottom",
            "The Reports tab runs report number ascending, so #1 is the first line and the numbers only climb as you scroll. The seeder now ages reports to match their numbers (#1 is about six months old, the newest is hours old), so the date and the number tell the same story. Finished (Fixed) reports are pinned below the open ones.",
        ],
        [
            "Analytics showing nothing",
            "The chart was a hard-coded mock with sample percentages. It now plots real counts from the database for the last six months, plus a status breakdown (New, Under Review, Scheduled, Repairing, Fixed) and a priority breakdown (P1, P2, P3).",
        ],
        [
            "The notification button has no use",
            "Removed from the portal header. Notifications stay in the resident app where they are actually read.",
        ],
        [
            "The top-left dropdown must actually drop down, to log out",
            "The hamburger now opens a menu showing the signed-in account (name and email) with a Log out button. Clicking anywhere outside closes it.",
        ],
        [
            "Progress moving becomes the teams' job, with a new team dashboard",
            "Eight field-team portals (Team A to Team H) sign in from the same login page. A crew opens a report and picks On site or Dispatched; the staff Teams tab shows where every crew is. The Advance button moved from the staff side to the team side; staff still see the progress, they just do not move it. Three rules guard it: only a crew that is on site at that report can advance, one report holds one crew at a time, and the status banner in the header is clickable straight through to the report the crew is working on.",
        ],
        [
            "Navbar reads \"Team (Alphabet) Portal\"; Pothole Portal renamed",
            "The team portal header shows \"Team A Portal\" through \"Team H Portal\" from the signed-in account. The office header now reads \"Staff Portal\".",
        ],
    ],
    [2.1, 4.1],
)

# ---------------------------------------------------------------- 2
doc.add_heading("2. How the team portals work", level=1)
doc.add_paragraph(
    "There is still one login page. The role stored on the account decides where the "
    "browser goes: resident to the app, staff to the Staff Portal, team to that crew's "
    "portal. Team accounts live in the same users table with role 'team', so sessions, "
    "passwords, logout and the 401 handling needed no new machinery."
)
doc.add_heading("The crew states", level=2)
doc.add_paragraph(
    "Each crew has exactly one state at a time, stored in the new dbo.teams table:"
)
table(
    ["State", "Meaning", "Set by"],
    [
        ["Available", "No job. Ready for the next dispatch.", "Default, or Stand down from the banner"],
        ["Dispatched", "Heading to a chosen report, not there yet.", "The Dispatched button on a report"],
        ["On site", "Working on that report right now.", "The On site button on a report"],
    ],
    [1.3, 3.2, 1.7],
)
doc.add_paragraph(
    "A report only gets claimed with a report attached to the state, so the office never "
    "sees \"on site at nothing\". When Team A picks On site on report #74, the staff Teams "
    "tab reads \"On site at #74 · Riverview\" within ten seconds, and the crew's own "
    "banner at the top of their portal shows the same thing."
)
doc.add_heading("Where progress moves", level=2)
doc.add_paragraph(
    "The status pipeline did not change (new, review, scheduled, repairing, fixed, with "
    "the same notifications and points). What changed is who can drive it: the PATCH "
    "endpoint now accepts staff or team sessions, and the button lives only in the Team "
    "Portal's report view. The staff report-details page keeps the timeline but now "
    "says the field team updates it, so there is one source of truth for progress."
)
doc.add_heading("Three rules the server enforces", level=2)
table(
    ["Rule", "What happens if you try", "Where it shows"],
    [
        [
            "Only a crew on site at the report can advance its progress",
            "403 with 'Your crew must be marked on site at this report to move its progress.'",
            "The Advance button is disabled with a note: Mark your crew On site at this report to move the progress.",
        ],
        [
            "One report, one crew",
            "409 with 'Report #N is already assigned to Team X.'",
            "The On site and Dispatched buttons lock with a note naming the crew already there.",
        ],
        [
            "The banner goes to the report",
            "No error: clicking it opens that report's view.",
            "The On site/Dispatched banner reads 'tap to open this report'.",
        ],
    ],
    [1.8, 2.4, 2.0],
)
doc.add_heading("The team portal itself", level=2)
bullets(
    [
        "Two tabs only: Overview and Reports, as asked. Overview shows the same stat tiles, heatmap and recent work the office sees.",
        "A live banner under the header shows the crew's current state with a Stand down button.",
        "Reports are ordered the same way as the staff tab: oldest first, fixed at the bottom.",
        "Opening a report shows the On site and Dispatched buttons (the active one highlighted) and the Advance button for the progress.",
    ]
)

# ---------------------------------------------------------------- 3
doc.add_heading("3. The API and database pieces added", level=1)
table(
    ["Piece", "What it does"],
    [
        ["dbo.teams table", "One row per crew: status, the report they are on, and when it last changed."],
        ["GET /api/v1/teams", "Staff or team sessions. Returns every crew with its live state and report, ordered by name."],
        ["POST /api/v1/teams/status", "Team sessions only. Sets available, dispatched or onsite; dispatched and onsite must name a real report, and the row is upserted so a crew can only have one state."],
        ["PATCH /api/v1/reports/:id", "Now accepts staff or team (was staff only). Residents still get 403."],
        ["Staff stats extension", "Monthly report counts for the last six months, plus status and priority breakdowns, so Analytics plots real data."],
        ["Seed additions", "Eight team accounts (teama@staff.com to teamh@staff.com, password team123), demo assignments (Team A on site, Team B dispatched), and synthetic reports spread over six months instead of 30 days so the chart has history."],
    ],
    [1.9, 4.3],
)

doc.add_heading("Ranks, badges and the leaderboard", level=2)
doc.add_paragraph(
    "The resident side gained a ranking system that is scored rather than "
    "decorated. Points were always real (plus 50 whenever a report reaches "
    "Fixed), but the title under the name was hard-coded and the badges were "
    "shown as earned whether they were or not. Both now come from the data."
)
table(
    ["Rank (title under the name)", "Level", "Reached at"],
    [
        ["Newcomer", "1", "0 points"],
        ["Road Spotter", "2", "300 points"],
        ["Road Warrior", "3", "700 points"],
        ["Road Guardian", "4", "1,500 points"],
        ["Road Legend", "5", "3,000 points"],
    ],
    [3.0, 1.0, 2.2],
)
doc.add_paragraph(
    "The title and the level chip are two views of the same ladder, both "
    "computed from the point total, so they can never disagree. When a report "
    "is closed and the +50 points land, the level is recomputed in the same "
    "breath, so a rank-up happens the moment it is earned."
)
doc.add_paragraph("Badges are scored against real counts and shown greyed out until earned:")
bullets(
    [
        "First Report: submit your first report.",
        "Veteran Reporter: submit 5 reports. (Renamed from the old Road Warrior badge so it does not clash with the Road Warrior rank.)",
        "Community Hero: get 3 reports fixed.",
        "Top Reporter: reach 1,000 points.",
    ]
)
doc.add_paragraph(
    "Under the badges the profile names the next one up and how to get it, "
    "instead of leaving a row of grey shapes unexplained. The report-details "
    "page also shows each reporter's actual rank beside their name now, which "
    "was the fixed text Road Warrior for everyone."
)
doc.add_paragraph(
    "The new GET /api/v1/leaderboard ranks the residents against each other: "
    "top ten with position, rank title, points, and report counts, plus where "
    "the signed-in resident sits even outside the ten. The Profile page shows "
    "it as a Top reporters card with the current user highlighted, and staff "
    "and team accounts are excluded from the board."
)

# ---------------------------------------------------------------- 4
doc.add_heading("4. How it was tested", level=1)
doc.add_paragraph(
    "Everything below was run on this laptop on 22 October 2026 against the real server "
    "and database."
)
doc.add_heading("Live walkthrough in the browser", level=2)
numbered(
    [
        "Signed in as staff@potholepal.test. The header reads Staff Portal; the Teams tab already showed Team A on site at #13, Team B heading to #23, Teams C to H available.",
        "Opened Reports: 97 rows, report number ascending (#1, #3, #5, #7 leading), open reports climbing to #1024, and every Fixed report pinned below the boundary. The dates match the numbers: #1 is five months old, #1024 is two hours old.",
        "Opened Analytics: six real bars (May 16, Jun 9, Jul 16, Aug 18, Sep 17, Oct 20), status counts 20/18/12/7/40, priority counts 10/60/27.",
        "Clicked the hamburger: the menu dropped down with P. Mokoena and staff@potholepal.test plus Log out. Logging out returned to the sign-in page.",
        "Signed in as teama@staff.com (password team123). The header reads Team A Portal, only Overview and Reports exist, and the banner showed the crew's live state with Stand down.",
        "Clicked the banner's status line: it opened the report the crew is working on. Claimed report #3 with On site, and the banner became 'On site #3, tap to open this report'.",
        "With the crew available, the Advance button was disabled behind the note 'Mark your crew On site at this report to move the progress'. After claiming #3, it enabled.",
        "On report #1 (held by Team B), the On site and Dispatched buttons were locked with 'This report is already assigned to Team B. Only one crew can work a report at a time.'",
        "With Team A on site at #3, clicking Advance moved it to Fixed; the staff API confirmed report #3 as fixed and Team A on site at #3.",
        "The browser console stayed empty through the whole walkthrough (the only entries were from the deliberate server restart window).",
    ]
)
doc.add_heading("Automated checks", level=2)
numbered(
    [
        "npm run lint: clean, zero problems.",
        "npm run build: built in about 11 seconds.",
        "bash server/smoke-test.sh from the project root: 48 of 48 checks passed. The original 26 still pass unchanged; twelve team checks cover the crew rules, and ten rank checks cover the +50 points payout landing on 1300, the rank title and level following the ladder, badge rules firing (first earned, veteran still locked, top reporter earned on points), and the leaderboard order with positions 1 to 4 and the signed-in resident's own position.",
        "npm run db:reset after testing, so the demo data is back to the canonical state: 14 users, 97 reports, Team A on site, Team B dispatched.",
    ]
)
note(
    "One thing worth repeating for next time: the smoke test must run from the project "
    "root, not from server/. Its photo paths are relative to the root, and running it "
    "from server/ makes every upload check fail with an empty response code."
)

# ---------------------------------------------------------------- 5
doc.add_heading("5. Commands used today, step by step", level=1)
doc.add_heading("Bring a fresh machine up to date", level=2)
numbered(
    [
        "npm install in the project root, and again in server/.",
        "cd server && npm run db:setup (adds the teams table; safe to rerun).",
        "cd server && npm run db:reset (clean demo data with the team assignments).",
        "npm run build in the root.",
        "cd server && npm start, then open http://localhost:3001.",
    ]
)
doc.add_heading("Test both portals", level=2)
numbered(
    [
        "Staff: sign in as staff@potholepal.test / staff123. Check the Reports order, the Analytics bars, and the hamburger menu.",
        "Teams: sign in as teama@staff.com / team123 (same pattern for teamb through teamh). Open a report, click On site or Dispatched, then Advance the progress.",
        "Watch the staff Teams tab update within ten seconds of a crew changing state.",
        "Run bash server/smoke-test.sh from the project root for the automated version.",
    ]
)
doc.add_heading("Reset the demo after a messy run", level=2)
numbered(
    [
        "cd server && npm run db:reset",
        "Expect 'team demo state seeded (Team A on site at ..., Team B dispatched to ...)' and 'seed complete: 14 users, 97 reports'.",
    ]
)

# ---------------------------------------------------------------- 6
doc.add_heading("6. Screenshots taken during the session", level=1)
bullets(
    [
        "screenshots/staff-reports-order.png: the Reports tab starting at #1 with numbers climbing.",
        "screenshots/staff-analytics.png: the Analytics tab with six real monthly bars, status and priority breakdowns.",
        "screenshots/team-banner-open.png: the clickable banner opening the crew's report.",
        "screenshots/team-rules-locked.png: both rules locked on a held report (buttons disabled, Advance behind the on-site note).",
        "screenshots/profile-ranks.png: the Profile with the Road Warrior title, earned and greyed badges, the next-badge hint, and the Top reporters leaderboard.",
    ]
)
doc.add_paragraph(
    "The live preview stayed registered on http://localhost:3001 throughout, so the work "
    "could be watched as it happened rather than only reviewed afterwards."
)

# ---------------------------------------------------------------- 7
doc.add_heading("7. Accounts after today", level=1)
table(
    ["Role", "Email", "Password", "Lands on"],
    [
        ["Resident", "alex@potholepal.test", "resident123", "The resident app"],
        ["Staff", "staff@potholepal.test", "staff123", "Staff Portal"],
        ["Staff", "nkosi@municipalstaff.com", "staff123", "Staff Portal"],
        ["Team A", "teama@staff.com", "team123", "Team A Portal"],
        ["Teams B to H", "teamb@staff.com ... teamh@staff.com", "team123", "Team B Portal ... Team H Portal"],
    ],
    [1.1, 2.4, 1.2, 1.7],
)
note(
    "Team accounts sit on the free staff.com domain, not municipalstaff.com, and "
    "registration only ever creates residents, so nobody can sign up their way into a "
    "portal."
)

# ---------------------------------------------------------------- save
out = "docs/PotholePal-day4-portals.docx"
try:
    doc.save(out)
    print("saved:", out)
except PermissionError:
    alt = "docs/PotholePal-day4-portals-updated.docx"
    doc.save(alt)
    print("Word has the file open; saved to:", alt)
