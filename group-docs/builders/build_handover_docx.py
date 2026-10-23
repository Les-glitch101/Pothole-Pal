"""Build group-docs/PotholePal-day1-handover.docx.

Re-run after editing the content below (from the project root):
python group-docs/builders/build_handover_docx.py
"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

BLUE = RGBColor(0x1D, 0x5B, 0xEB)
GREY = RGBColor(0x64, 0x74, 0x8B)

doc = Document()

# Base style
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(11)


def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        run = p.add_run(h)
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
title = doc.add_heading("PotholePal: day one handover", level=0)
title.runs[0].font.color.rgb = BLUE
sub = doc.add_paragraph()
run = sub.add_run("Monday 19 October 2026  ·  The City Fix Team (Lesiamo, Crystal, Kgosi, Raymond)")
run.font.color.rgb = GREY
run.font.size = Pt(10)

doc.add_paragraph(
    "This is what got built today, how the app is put together, what the API has to "
    "look like, and what to do tomorrow morning. It assumes you were not here, so "
    "everything is spelled out."
)

# ---------------------------------------------------------------- 1
doc.add_heading("Where the project stands", level=1)
doc.add_paragraph(
    "The app is a working front end. A resident can open it, walk through the four-step "
    "report flow, get a reference number back, and watch the report move along a status "
    "timeline. A staff member can open the municipality portal and see the same reports "
    "with priority tiles and a heatmap. Eleven screens exist and every one of them is "
    "reachable by tapping, no URL typing needed."
)
doc.add_paragraph(
    "What it is not is a full system. There is no database and no server, so every report "
    "lives in memory and disappears when the page reloads. The numbers on the home screen "
    "and the dashboard are fixed strings. Nobody signs in. Closing that gap is the whole "
    "job for tomorrow and Wednesday."
)
doc.add_paragraph(
    "Dates from the project plan: chapter drafts are due Friday 23 October, the triage "
    "comparison figures are due Thursday 22 October, and the dissertation plus demo are "
    "due Thursday 29 October. The priority rule further down feeds directly into the "
    "triage figures, so it is worth building early."
)

# ---------------------------------------------------------------- 2
doc.add_heading("What was built today", level=1)

doc.add_heading("The morning audit", level=2)
doc.add_paragraph(
    "The repo started with one commit and seven screens. The code compiled, but the app "
    "did not hold together as a product:"
)
bullets([
    "Step 1 of the report flow jumped straight to step 4. Steps 2 and 3 could only be "
    "reached by typing the URL.",
    "Every back arrow did nothing. Confirm Location, both Next buttons and Submit Report "
    "had no click handler, so nothing was ever submitted and no reference number existed.",
    "The Reports tab in the bottom bar pointed at /report, which had no route and rendered "
    "a blank white page.",
    "The review screen showed a hardcoded address (123 Maple Ave, Riverton, CA) instead of "
    "anything the user had typed.",
    "Icons were loaded as src/assets/Home.png style strings. Vite only serves those in "
    "development, so every icon would have 404'd in a production build.",
    "Four of the badge images referenced files that do not exist in the repo.",
    "Two lint errors: the severity state in step 3 was declared and never used.",
])

doc.add_heading("The afternoon rebuild", level=2)
doc.add_paragraph(
    "The designer had already produced a Figma file with ten frames. I read all ten, then "
    "rebuilt the screens against them rather than patching the old ones, because the old "
    "markup could not express the design (no cards, no chips, no timeline, no dark portal)."
)
bullets([
    "Design tokens in src/index.css: the blue #1d5beb, the navy #0a1c2b, the greys, and the "
    "Inter typeface, written as Tailwind 4 theme variables so classes like bg-primary and "
    "text-muted work everywhere.",
    "A 39-icon inline SVG set in src/lib/icons.jsx, replacing the missing PNGs. No image "
    "files are needed for the interface any more.",
    "Leaflet maps with Esri's keyless light-grey tiles, used on Home, on the map screen, on "
    "the location step, and as the heatmap in the portal.",
    "Four new screens the design needed and the app did not have: Notifications, My "
    "Reports, Report Details, and the municipality portal.",
    "A shared report draft in src/context/flow.js, so step 1 can hand its photo to step 2 "
    "and step 3 can hand its fields to the review screen.",
    "The flow wired end to end, with a reference number generated on submit and a live "
    "details page behind it.",
    "Your logo, sized down with Pillow and wired into the Home header, the browser tab, and "
    "the production build.",
])

doc.add_heading("Bugs found by looking at the running app", level=2)
doc.add_paragraph(
    "These were not in any error log. They only showed up on screen, which is why the "
    "verification step walked every screen instead of stopping at a green build:"
)
bullets([
    "The map tiles printed KEY REQUIRED across them. CartoDB started requiring an API key "
    "for the basemap we were using. Switched to Esri's World Light Gray Base, which needs "
    "no key and looks the same.",
    "The report card on the map screen and the buttons on the location step were invisible. "
    "Leaflet draws its own layers with internal z-indexes up to 700, so anything stacked "
    "normally ends up underneath the map. Those elements now carry z-[600].",
    "The map sometimes opened zoomed into the wrong place. React's StrictMode runs effects "
    "twice in development, and the marker pass could land before the second map existed, so "
    "the fit-to-bounds call was lost. The map now bumps a version counter when it is "
    "created and the marker pass waits on it.",
    "The lint config flagged every destructured icon component as unused. ESLint core has no "
    "JSX awareness, so it cannot see that Icon is used as a tag. The existing rule already "
    "ignored unused capitals for variables; the same pattern was added for arguments.",
])

# ---------------------------------------------------------------- 3
doc.add_heading("How the app is put together", level=1)
doc.add_paragraph(
    "JavaScript with JSX, no TypeScript. React 19.1, Vite 7.3, Tailwind CSS 4, "
    "react-router-dom 7.18, Leaflet 1.9. There is no test suite yet."
)
table(
    ["Path", "What it does"],
    [
        ["app/src/App.jsx", "Holds the report draft and the list of submitted reports, and maps every URL to a screen."],
        ["app/src/context/flow.js", "The shared draft object (photo, location, size, damage and so on) plus the shape of a submitted report."],
        ["app/src/lib/data.js", "All mock content: the seven seeded reports, statuses, notifications, dashboard figures. This is the file the API replaces."],
        ["app/src/lib/icons.jsx", "The inline SVG icon set."],
        ["app/src/components/LeafletMap.jsx", "One map component used four times. Handles markers, cluster badges, heatmap blobs, and the draggable pin."],
        ["app/src/components/FlowHeader.jsx", "Back arrow, title and progress bars shared by the four flow steps."],
        ["app/src/components/navbar.jsx", "The five-tab bottom bar with active states."],
        ["app/src/pages/", "Home, Map, Profile, Notifications, MyReports, ReportDetails, Dashboard, and ReportPotholePage1 to 4."],
        ["app/server/", "The Express API server and its database scripts."],
        ["app/public/", "Logo files: the original plus 48, 96, 192 and 512 pixel versions."],
        ["group-docs/", "This document and the other deliverable documents."],
        ["group-docs/builders/", "The Python scripts that generate the documents."],
        ["archive/project-status.html", "The status board from this morning: live previews of every screen plus the feature table."],
    ],
    widths=[1.7, 4.6],
)

doc.add_heading("How the report flow works", level=2)
numbered([
    "Step 1 (src/pages/ReportPotholePage1.jsx) opens a dark camera screen. The shutter uses "
    "capture=environment so a phone opens the rear camera; the gallery button uses a plain "
    "file input. A sample photo button exists for laptops and for the demo.",
    "Step 2 shows a map with a draggable pin. Dragging it snaps the address to the nearest "
    "known area. Use my location asks the browser for coordinates. Confirm Location writes "
    "lat, lng and address into the draft.",
    "Step 3 collects the issue type, a description, and chip groups for size, depth, traffic "
    "impact and vehicle damage.",
    "Step 4 reviews everything with an edit pencil on each row that jumps back to the right "
    "step. Submit calls submitDraft() in App.jsx, which builds a report object with an id, "
    "a status of new, and a timeline, then navigates to its details page.",
    "The details page reads the report by id and draws the five-stage progress timeline. A "
    "submitted report starts at Reported with the rest pending.",
])
note(
    "The whole flow runs client-side right now. Only two functions change when the backend "
    "lands: submitDraft() becomes a POST, and the list of reports becomes a GET."
)

# ---------------------------------------------------------------- 4
doc.add_heading("The API", level=1)
doc.add_paragraph(
    "This is the part to read twice. The front end already has fixed shapes it expects, so "
    "the API below returns exactly those shapes and the screens need almost no changes."
)

doc.add_heading("Recommendation", level=2)
doc.add_paragraph(
    "Node with Express, SQLite through better-sqlite3, and multer for photo uploads. SQLite "
    "is a single file, installs with one command, and cannot fail to start during a demo. "
    "The schema below is plain SQL, so if the module requires MySQL for the mark, the same "
    "schema loads into MySQL and the queries move over with small changes."
)
doc.add_paragraph(
    "The project plan mentions MySQL and SQL Server. Two databases is more work than this "
    "deadline allows. Pick one and say so in the dissertation."
)

doc.add_heading("Shape of every response", level=2)
doc.add_paragraph(
    "JSON under /api/v1. Success returns the object or a list directly. Failure returns an "
    "error envelope with a code the front end can branch on:"
)
doc.add_paragraph('{ "error": { "code": "duplicate_report", "message": "Already reported.", "ref": "#1024" } }')
note("Auth uses an Authorization: Bearer <token> header. Sessions can be a signed token or a server-side session; either is fine at this scope.")

doc.add_heading("Endpoints", level=2)
table(
    ["Method", "Path", "Who", "What it does"],
    [
        ["POST", "/api/v1/auth/register", "public", "Name, email, password. Returns the user and a token."],
        ["POST", "/api/v1/auth/login", "public", "Email and password. Returns a token."],
        ["GET", "/api/v1/auth/me", "any", "The signed-in user, for the Profile screen."],
        ["GET", "/api/v1/reports", "any", "List for the map screen and Home. Query: status, q (area or street search), lat, lng, radius, page."],
        ["GET", "/api/v1/reports/:id", "any", "One report in full, for the details screen."],
        ["POST", "/api/v1/reports", "resident", "Create a report. Multipart form: photo file plus lat, lng, address, issueType, size, depth, traffic, damage, description. Runs the duplicate check. Returns the report with its reference number."],
        ["GET", "/api/v1/reports/:id/history", "any", "Status changes in order. The details screen maps these into its timeline array."],
        ["PATCH", "/api/v1/reports/:id", "staff", "Change status, assign a crew, or add a note. Every change appends to history and fires a notification."],
        ["GET", "/api/v1/staff/queue", "staff", "Reports needing triage, sorted by priority. Powers the portal Reports tab."],
        ["GET", "/api/v1/staff/stats", "staff", "Totals, new count, fixed count, resolution rate, and the heatmap points."],
        ["GET", "/api/v1/stats", "any", "Home screen figures: reports nearby, total, fixed."],
        ["GET", "/api/v1/notifications", "resident", "Grouped Today and Earlier, matching the Notifications screen."],
        ["POST", "/api/v1/notifications/:id/read", "resident", "Mark one read."],
        ["GET", "/api/v1/me/points", "resident", "Points, level and badges for Profile. Phase two."],
    ],
    widths=[0.75, 2.1, 0.85, 3.1],
)

doc.add_heading("What a report looks like on the wire", level=2)
doc.add_paragraph(
    "This matches src/lib/data.js field for field, which is deliberate:"
)
for line in [
    "{",
    '  "id": 1024,',
    '  "ref": "#1024",',
    '  "area": "Three Rivers",',
    '  "address": "Vereeniging, Gauteng, South Africa",',
    '  "lat": -26.6639, "lng": 27.9219,',
    '  "issueType": "Pothole",',
    '  "size": "Medium", "depth": "Moderate",',
    '  "severity": "Medium", "severityNote": "Medium",',
    '  "traffic": "Low", "damage": "No",',
    '  "description": "Large pothole near the traffic light.",',
    '  "status": "repairing",',
    '  "priority": "P2",',
    '  "reportedAt": "2 hours ago",',
    '  "photo": "/uploads/1024.jpg",',
    '  "isMine": false,',
    '  "timeline": [',
    '    { "status": "new", "at": "2026-10-15T10:32:00Z" },',
    '    { "status": "review", "at": "2026-10-15T11:00:00Z" }',
    "  ]",
    "}",
]:
    p = doc.add_paragraph()
    run = p.add_run(line)
    run.font.name = "Consolas"
    run.font.size = Pt(9)

doc.add_heading("Status lifecycle", level=2)
doc.add_paragraph(
    "These five values are already in the front end, the map colours, and the timeline. "
    "Keep them exactly as they are."
)
table(
    ["Value", "Label", "Colour", "Meaning", "Who moves it there"],
    [
        ["new", "New", "Red #ef4444", "Submitted, not seen by staff yet.", "System, on POST"],
        ["review", "Under Review", "Amber #d97706", "Staff opened it, checking for duplicates.", "Staff"],
        ["scheduled", "Scheduled", "Blue #1d5beb", "Crew assigned, work planned.", "Staff"],
        ["repairing", "Repairing", "Blue #1d5beb", "Crew on site.", "Staff"],
        ["fixed", "Fixed", "Green #16a34a", "Done. Notify the reporter and award points.", "Staff"],
    ],
    widths=[0.9, 1.15, 1.15, 2.3, 1.3],
)

doc.add_heading("Priority rule", level=2)
doc.add_paragraph(
    "The form already collects everything this needs. Score each report:"
)
table(
    ["Field", "Values and points"],
    [
        ["size", "Small 1, Medium 2, Large 3"],
        ["depth", "Shallow 1, Moderate 2, Deep 3"],
        ["traffic", "Low 1, Medium 2, High 3"],
        ["damage", "No 0, Yes 2"],
    ],
    widths=[1.3, 4.9],
)
doc.add_paragraph("Then map the total to a priority:")
table(
    ["Priority", "Score", "What it means"],
    [
        ["P1", "9 or more, or damage is Yes on a high traffic road", "Fix within the week. Lead story for the demo."],
        ["P2", "6 to 8", "Normal queue."],
        ["P3", "5 or less", "Batch with the next road maintenance run."],
    ],
    widths=[0.9, 2.4, 2.9],
)
note(
    "Store the score as a number in the database. The triage comparison figures due "
    "Thursday 22 October compare this rule against how Emfuleni actually prioritises, and "
    "that comparison needs the raw scores."
)

doc.add_heading("Duplicate matching", level=2)
doc.add_paragraph(
    "Requirement FR-03 in the project docs. The rule to implement:"
)
numbered([
    "On POST /api/v1/reports, look for reports whose status is not fixed, within 50 metres "
    "of the submitted point, created in the last 7 days.",
    "If one is found, do not create a second work item. Return 409 with the existing "
    "reference and bump a duplicate_count on that report.",
    "The UI then shows: This pothole was already reported, reference #1024, and offers to "
    "add the new photo as supporting evidence.",
    "50 metres is generous on purpose. It is a starting point; say in the dissertation that "
    "you tuned it and how.",
])
doc.add_paragraph(
    "Distance is a short haversine query. With SQLite, load candidates with a lat and lng "
    "bounding box first (a plain indexed range query, cheap) and then compute exact "
    "distance on that small set."
)

# ---------------------------------------------------------------- 5
doc.add_heading("Database schema", level=1)
table(
    ["Table", "Columns", "Notes"],
    [
        ["users", "id, name, email UNIQUE, password_hash, role (resident or staff), points, level, created_at", "role drives what the API allows."],
        ["reports", "id, ref UNIQUE, reporter_id, lat, lng, address, area, issue_type, size, depth, traffic, damage, description, status, priority, score, duplicate_count, photo_url, created_at, updated_at, scheduled_at, fixed_at", "One row per work item. Index on status, on (lat, lng), and on reporter_id."],
        ["report_status_history", "id, report_id, status, note, changed_by, created_at", "Feeds the timeline. Append only."],
        ["notifications", "id, user_id, report_id NULL, type, title, body, is_read, created_at", "type drives the icon: verified, scheduled, fixed, points, comment, alert."],
        ["crews", "id, name, area, status", "Optional. Only needed if you want the Teams tab to be real."],
    ],
    widths=[1.35, 3.6, 1.35],
)
doc.add_paragraph(
    "Photos: store the file on disk under uploads/ and keep the path in reports.photo_url. "
    "Do not put images in the database. The uploads folder needs to be in .gitignore."
)

# ---------------------------------------------------------------- 6
doc.add_heading("Plan for tomorrow", level=1)
doc.add_paragraph("Roughly ordered by what breaks the demo if it is missing.")
numbered([
    "08:30, 15 min. Commit today. The repo has one commit and everything from today is "
    "sitting uncommitted. That is the single biggest risk on the machine right now.",
    "09:00, 15 min. Confirm with the lecturer whether the module wants MySQL. That decides "
    "the driver, not the schema.",
    "09:30, 1 h. Scaffold server/ with Express, better-sqlite3 and multer. Write the schema "
    "as a migration script and seed it with the seven mock reports so the screens have real "
    "rows to fetch.",
    "10:30, 1 h. GET /api/v1/reports, then swap src/lib/data.js for a fetch on the map "
    "screen and Home. First real data on screen.",
    "11:30, 1.5 h. POST /api/v1/reports with photo upload and the duplicate check. The "
    "reference number comes from the database now. This is the requirement the whole pitch "
    "rests on.",
    "13:30, 1 h. GET /api/v1/reports/:id and its history, wired into the details timeline.",
    "14:30, 1 h. PATCH for staff status changes, plus the staff queue and stats endpoints, "
    "so the portal drives the citizen's timeline.",
    "15:30, 1 h. Notifications: created on every status change, listed on the screen.",
    "16:30, until done. Points and badges if time allows. Otherwise leave Profile on mock "
    "figures and say so.",
    "17:00. Run the demo end to end on a phone, then commit.",
])
doc.add_paragraph(
    "If the API slips, do the localStorage fallback first: about an hour of work, it keeps "
    "reports across reloads, and it means the demo survives even with no server running. "
    "The submit function and the report list are the only two places it touches."
)

doc.add_heading("Decisions that are still open", level=2)
bullets([
    "MySQL or SQLite. Depends on the module requirements.",
    "Accounts for residents, or keep it single-user for the demo and add auth later. The "
    "role field in the schema covers both.",
    "Whether the staff portal is a separate login or just a demo toggle. Right now it is a "
    "button at the bottom of Profile marked demo.",
    "What the assessor sees on Thursday 29 October. Worth one rehearsal on Tuesday.",
])

# ---------------------------------------------------------------- 7
doc.add_heading("Known issues", level=2)
bullets([
    "The original logo in public/ is 1.28 MB. The 96 pixel version in the header is 16 KB "
    "and is what the app actually loads, so this is cosmetic, but the big file should not "
    "ship.",
    "Profile menu rows for My Impact, Leaderboard, Settings and Help and Support do nothing. "
    "They are on the plan above for tomorrow.",
    "The Flip camera button and the map layers button are visual only.",
    "No error boundary. If a screen throws, React takes the whole page down. Worth 20 "
    "minutes once the API exists.",
    "No tests. The report flow is the thing to test first, and it is pure state, so it is "
    "cheap to test.",
    "State resets on reload. Covered by the backend work above.",
])

# ---------------------------------------------------------------- 8
doc.add_heading("Running the app", level=1)
doc.add_paragraph("Dependencies are already installed. From the app folder (app/):")
for line in [
    "npm run dev                  # start on http://127.0.0.1:5173",
    "npm run dev -- --port 5173   # explicit port, use this if 5173 is taken",
    "npm run lint                 # eslint, currently clean",
    "npm run build                # production build into app/dist/",
]:
    p = doc.add_paragraph()
    run = p.add_run(line)
    run.font.name = "Consolas"
    run.font.size = Pt(9)

note(
    "This machine has no Node on the PATH. Today a portable Node 24 was unpacked to "
    "%LOCALAPPDATA%\\Temp\\node-portable\\node-v24.22.0-win-x64 and used from there. That "
    "folder is temporary. Install Node LTS properly before tomorrow, otherwise the first "
    "command tomorrow morning will fail with npm not found."
)

out = "group-docs/PotholePal-day1-handover.docx"
doc.save(out)
print("wrote", out)
