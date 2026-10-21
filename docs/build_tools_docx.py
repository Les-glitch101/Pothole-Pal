"""Build docs/PotholePal-tools-and-testing.docx.

Re-run after editing the content below:  python docs/build_tools_docx.py
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


def code(lines):
    for line in lines:
        p = doc.add_paragraph()
        run = p.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(9)


# ---------------------------------------------------------------- title
title = doc.add_heading("PotholePal: the tools we used, and how to run everything", level=0)
title.runs[0].font.color.rgb = BLUE
sub = doc.add_paragraph()
run = sub.add_run(
    "Wednesday 21 October 2026  ·  The City Fix Team (Lesiamo, Crystal, Kgosi, Raymond)"
)
run.font.color.rgb = GREY
run.font.size = Pt(10)

doc.add_paragraph(
    "This document lists every tool in the PotholePal project, explains what each one "
    "actually is, says what we use it for, and gives the exact steps to run it on this "
    "laptop. Everything below was run here on 21 October 2026, so the commands, outputs "
    "and test results are real and repeatable."
)

# ---------------------------------------------------------------- 1
doc.add_heading("1. How the system fits together", level=1)
doc.add_paragraph(
    "PotholePal has two halves that talk to each other over HTTP, plus a database that "
    "remembers everything."
)
doc.add_paragraph(
    "The front end is a React app that looks like a phone screen. It handles the pages "
    "you click: sign in, the home map, the four report steps, report details, "
    "notifications, and the municipal dashboard."
)
doc.add_paragraph(
    "The back end is an API server built with Express. It owns the database, works out "
    "who is signed in, and decides what each person is allowed to do. The front end "
    "never touches the database directly; every list, photo and status change arrives "
    "through the API."
)
doc.add_paragraph(
    "The database is SQL Server. It holds the accounts, the reports, the status history "
    "and the notifications. Seeding scripts fill it with demo data so the app is never "
    "empty during a demo."
)
table(
    ["Part", "What it is", "What it does here"],
    [
        ["Front end (React + Vite)", "A single-page web app built from components", "Every screen the user sees"],
        ["API server (Express)", "A program that answers HTTP requests with JSON", "Sign-in, reports, statuses, notifications"],
        ["SQL Server", "A relational database (tables joined by ids)", "Permanent storage for accounts and reports"],
        ["Photo uploads (server/uploads)", "Image files on disk, served back at /uploads", "The pothole pictures attached to reports"],
    ],
    [1.6, 2.3, 2.3],
)

# ---------------------------------------------------------------- 2
doc.add_heading("2. The tools, one by one", level=1)

doc.add_heading("Node.js and npm", level=2)
doc.add_paragraph(
    "What they are: Node.js runs JavaScript outside the browser, which is what lets us "
    "write the server in the same language as the front end. npm comes with Node; it "
    "installs the packages listed in package.json and runs the project's named scripts "
    "so nobody has to remember the full commands."
)
doc.add_paragraph(
    "What we use them for: running the API server, the database scripts, the front end "
    "build, and every check described later in this document."
)
table(
    ["Script", "Where", "What it does"],
    [
        ["npm run dev", "project root", "Starts the Vite dev server on port 5173 with hot reload"],
        ["npm run build", "project root", "Bundles the front end into dist/ for production"],
        ["npm run lint", "project root", "Runs ESLint over the whole front end"],
        ["npm start", "server/", "Starts the API server (reads server/.env)"],
        ["npm run db:setup", "server/", "Applies server/db/schema.sql to the database"],
        ["npm run db:seed", "server/", "Fills the database with demo accounts and reports"],
        ["npm run db:reset", "server/", "Deletes the demo data, then seeds it again"],
        ["npm run certs", "server/", "Creates the self-signed certificate for HTTPS phone testing"],
    ],
    [1.6, 1.3, 3.3],
)

doc.add_heading("Express", level=2)
doc.add_paragraph(
    "What it is: a small web framework for Node.js. It gives us a router (URLs mapped to "
    "functions), request parsing, a central error handler, and static file serving."
)
doc.add_paragraph(
    "What we use it for: server/index.js defines every endpoint under /api/v1, guards the "
    "ones that need a signed-in user or a staff role, stores uploaded photos, and also "
    "serves the built front end from dist/. One process therefore runs the whole app at "
    "http://localhost:3001."
)

doc.add_heading("SQL Server and the mssql driver", level=2)
doc.add_paragraph(
    "What they are: SQL Server is Microsoft's relational database, where data lives in "
    "tables with rows related by id numbers. mssql is the Node.js package that lets the "
    "server send SQL statements and get rows back."
)
doc.add_paragraph(
    "What we use it for: all stored data. The schema is server/db/schema.sql, which "
    "creates five tables."
)
table(
    ["Table", "Holds"],
    [
        ["users", "Accounts: name, email, hashed password, role (resident or staff), points"],
        ["reports", "One row per pothole: coordinates, answers, status, priority score, photo"],
        ["report_status_history", "One row each time a report's status changes, used for the progress timeline"],
        ["notifications", "Messages shown on the resident's notifications screen"],
        ["password_resets", "The hashed reset code for the forgot-password flow, with its expiry"],
    ],
    [2.0, 4.2],
)
doc.add_paragraph(
    "The schema file is written so it can run more than once without errors, which is why "
    "db:setup is safe to repeat."
)

doc.add_heading("bcryptjs (password hashing)", level=2)
doc.add_paragraph(
    "What it is: bcrypt is a password hashing function. It turns a password into a fixed "
    "string using a one-way calculation with a random salt, and it is deliberately slow so "
    "that guessing millions of passwords stays expensive."
)
doc.add_paragraph(
    "What we use it for: passwords are hashed before they are stored and compared against "
    "the hash at sign-in. No usable password ever touches the database. If the users table "
    "leaked tomorrow, the passwords in it would not work anywhere."
)

doc.add_heading("Sessions: bearer tokens", level=2)
doc.add_paragraph(
    "What it is: after a successful sign-in the server creates a random token and returns "
    "it with the user's details. The client keeps the token and sends it in the "
    "Authorization: Bearer header of every following request."
)
doc.add_paragraph(
    "What we use it for: keeping people signed in. The server holds the tokens in memory "
    "(a map of token to user), so a server restart signs everyone out and the app reacts "
    "to the next 401 by showing the sign-in screen again. Any request without a valid "
    "token gets a 401, and a resident asking for a staff endpoint gets a 403."
)

doc.add_heading("multer (photo uploads)", level=2)
doc.add_paragraph(
    "What it is: multer is the Node package that parses multipart/form-data, the encoding "
    "a browser uses when a form carries a file alongside ordinary fields."
)
doc.add_paragraph(
    "What we use it for: POST /api/v1/reports arrives as one multipart request containing "
    "the photo and all the answers. The photo is saved in server/uploads under a random "
    "name, only images are accepted, and the size limit is 8 MB."
)

doc.add_heading("React and React Router", level=2)
doc.add_paragraph(
    "What they are: React builds the interface out of components that redraw themselves "
    "when their data changes. React Router maps URLs to pages and keeps the browser's back "
    "and forward buttons working."
)
doc.add_paragraph(
    "What we use them for: every screen. /reports is My Reports, /report-details/:id is "
    "one report, /staff is the municipal dashboard. Guard components send signed-out "
    "visitors to /login, and the report flow shares its draft answers through a small "
    "React context."
)

doc.add_heading("Vite", level=2)
doc.add_paragraph(
    "What it is: a development server and bundler for modern front ends. In development it "
    "serves the code in small pieces and refreshes the browser when you save a file. "
    "npm run build compiles everything into dist/, which Express then serves."
)
doc.add_paragraph(
    "What we use it for: day-to-day front end work on http://localhost:5173, where "
    "vite.config.js forwards /api and /uploads to the real server on port 3001, and the "
    "production bundle behind http://localhost:3001."
)

doc.add_heading("Tailwind CSS", level=2)
doc.add_paragraph(
    "What it is: a utility-first styling system. Instead of hand-written stylesheet files, "
    "the markup composes small classes like rounded-2xl and font-extrabold."
)
doc.add_paragraph(
    "What we use it for: all the styling. The app's palette (the primary blue, navy, ink "
    "and muted grey) is defined once in src/index.css and used everywhere."
)

doc.add_heading("Leaflet", level=2)
doc.add_paragraph(
    "What it is: a free open-source library for interactive maps. The map images "
    "(tiles) come from Esri's light-gray basemap, which needs no API key."
)
doc.add_paragraph(
    "What we use it for: the home screen map, the full map page, the draggable pin on step "
    "two of the report flow, and the staff dashboard's heatmap of problem spots."
)

doc.add_heading("ESLint", level=2)
doc.add_paragraph(
    "What it is: a static checker. It reads the code without running it and reports "
    "patterns that are usually bugs: unused variables, missing keys in lists, effects with "
    "missing dependencies."
)
doc.add_paragraph(
    "What we use it for: npm run lint before any hand-in. The current tree passes with "
    "zero problems, and the command prints nothing when there is nothing to report."
)

doc.add_heading("curl", level=2)
doc.add_paragraph(
    "What it is: a command-line HTTP client. You give it a URL and options, it sends the "
    "request, and it prints the response including the status code. It ships with Git Bash "
    "on this laptop."
)
doc.add_paragraph(
    "What we use it for: testing the API without the interface, and as the engine of the "
    "smoke test. Every check described in section 3.5 and 3.4 is a curl call."
)

doc.add_heading("Smoke testing", level=2)
doc.add_paragraph(
    "What it is: a smoke test is a short automated pass over the critical paths of a "
    "running system. The name comes from checking a new machine for smoke before powering "
    "it up. It is not a full test suite; it answers one question quickly: did anything "
    "obvious break?"
)
doc.add_paragraph(
    "What ours covers: server/smoke-test.sh runs 26 checks against the live server at "
    "http://localhost:3001. They cover signing in as a resident and as staff, a wrong "
    "password, the signed-out 401, the reports list and report ownership, the dashboard "
    "counts, submitting a report (status code, reference number, priority score, "
    "ownership), the duplicate guard answering 409 with the existing reference, the rule "
    "that only staff may change a status, the notification a status change creates, the "
    "staff queue order, and attaching a photo as evidence instead of creating a second "
    "work item."
)
doc.add_paragraph(
    "How it reports: one PASS or FAIL line per check, a final ALL SMOKE TESTS PASSED line, "
    "and an exit code of 0 when everything passed. FAIL lines show what the server answered "
    "and what was expected, which is usually enough to find the bug."
)

doc.add_heading("The API itself", level=2)
doc.add_paragraph(
    "What it is: API stands for application programming interface. In web work it means a "
    "set of URLs that speak JSON: the front end sends a request with a method (GET, POST, "
    "PATCH), the server answers with data or an error code. APIs are how the two halves of "
    "an application stay separate, and they are also what makes the system testable "
    "without a screen."
)
doc.add_paragraph(
    "The rules ours follows: every protected request carries the token in an "
    "Authorization header; answers come back as JSON; errors always share one shape, "
    '{"error": {"code": "...", "message": "..."}}, so the front end can show the message '
    "directly."
)
table(
    ["Method and path", "Who", "What it does"],
    [
        ["POST /api/v1/auth/register", "Anyone", "Creates a resident account (staff email domain refused)"],
        ["POST /api/v1/auth/login", "Anyone", "Signs in and returns a token plus the user"],
        ["POST /api/v1/auth/logout", "Signed in", "Ends the session"],
        ["GET /api/v1/auth/me", "Signed in", "Returns the signed-in account"],
        ["POST /api/v1/auth/forgot", "Anyone", "Creates a six-digit reset code for that email"],
        ["POST /api/v1/auth/reset", "Anyone", "Exchanges the code for a new password and a fresh session"],
        ["GET /api/v1/reports", "Signed in", "Lists every report, each flagged with whether it is yours"],
        ["POST /api/v1/reports", "Resident", "Submits a report with its photo; 409 if one already sits within 50 m"],
        ["GET /api/v1/reports/:id", "Signed in", "Returns one report with its progress timeline"],
        ["PATCH /api/v1/reports/:id", "Staff only", "Changes a report's status; residents get a 403"],
        ["POST /api/v1/reports/:id/evidence", "Resident", "Attaches a supporting photo to an existing report"],
        ["GET /api/v1/stats", "Resident", "The numbers on the resident home screen"],
        ["GET /api/v1/notifications", "Signed in", "The notification list, grouped by day"],
        ["POST /api/v1/notifications/:id/read", "Signed in", "Marks one notification as read"],
        ["GET /api/v1/staff/queue", "Staff only", "The work queue, sorted by priority score"],
        ["GET /api/v1/staff/stats", "Staff only", "Dashboard totals plus the heatmap points"],
    ],
    [2.5, 1.0, 2.7],
)
doc.add_paragraph("The status codes you will see, and what they mean here:")
table(
    ["Code", "Means"],
    [
        ["200", "The request worked"],
        ["201", "Something new was created (an account, a report)"],
        ["400", "The input was wrong: a short password, a malformed id"],
        ["401", "Not signed in, or the password was wrong"],
        ["403", "Signed in, but this account may not do that (a resident touching a staff endpoint)"],
        ["404", "No such thing: unknown email, unknown report"],
        ["409", "Conflict: that email is registered, or that pothole is already reported"],
        ["500", "A bug on the server; the message is kept generic on purpose"],
    ],
    [0.9, 5.3],
)

doc.add_heading("A browser for real-world testing", level=2)
doc.add_paragraph(
    "What it is: driving the built app in an actual browser, the way a user would."
)
doc.add_paragraph(
    "What we use it for: every user-facing change. The developer console (F12) shows "
    "failed requests and JavaScript errors, so a broken flow is visible even when the "
    "screen looks fine. Screenshots are the evidence that a flow was actually walked and "
    "not only compiled; the ones in screenshots/ came from these sessions."
)

doc.add_heading("python-docx (these Word documents)", level=2)
doc.add_paragraph(
    "What it is: a Python library that builds .docx files from code: headings, paragraphs, "
    "tables, styles."
)
doc.add_paragraph(
    "What we use it for: every document in docs/ is generated by a small script "
    "(build_day2_docx.py, build_day3_docx.py, build_handover_docx.py, and this one). To "
    "change a document you edit its script and run it again, so a document can always be "
    "regenerated instead of being edited by hand and lost."
)

doc.add_heading("Git", level=2)
doc.add_paragraph(
    "What it is: a version control system. It records snapshots of the project (commits), "
    "keeps the history, and lets people merge work from different machines."
)
doc.add_paragraph(
    "What we use it for: the project repository on the master branch. The daily rhythm is "
    "git status to see what changed, git add with the files that belong to the change, and "
    "git commit with a short reason."
)

doc.add_heading("The coding assistant", level=2)
doc.add_paragraph(
    "What it is: the work described in this document was done with Buffy, the coding agent "
    "inside Freebuff. It reads and edits project files, runs terminal commands, and drives "
    "a browser window it shares with the person at the machine."
)
doc.add_paragraph(
    "What it was used for: writing the endpoints, pages and scripts; running the server, "
    "lint, builds, curl checks and the smoke suite; and walking the browser flows with "
    "screenshots. Its changes should be treated like anyone else's: read the diff, run the "
    "checks, then commit."
)

# ---------------------------------------------------------------- 3
doc.add_heading("3. Step-by-step guides", level=1)

doc.add_heading("3.1 Set everything up on a new machine", level=2)
numbered(
    [
        "Install Node.js (this project was verified on Node 24) and, for the documents, Python with pip install python-docx.",
        "Install the front end packages in the project root: npm install.",
        "Install the server packages: cd server, then npm install.",
        "Make sure server/.env points at your SQL Server database (the file already exists on this laptop).",
        "Create the tables: cd server, then npm run db:setup.",
        "Fill the demo data: npm run db:seed. You should see 'seed complete: 6 users, 97 reports ... 6 notifications'.",
        "Build the front end: cd .. (back in the root), then npm run build.",
        "Start the server: cd server, then npm start.",
        "Open http://localhost:3001 in a browser. The same address also serves the API.",
    ]
)
note(
    "A successful start prints 'PotholePal API on http://localhost:3001 (db: ...)' and, "
    "if certificates exist, 'PotholePal HTTPS on https://localhost:3443 (for phones)'. "
    "If the port is taken, the server says so and stops instead of fighting over it."
)

doc.add_heading("3.2 Work on the front end with hot reload", level=2)
numbered(
    [
        "Start the API in one window: cd server && npm start.",
        "Start the dev server in a second window, in the project root: npm run dev.",
        "Open http://localhost:5173. Vite forwards /api and /uploads to port 3001, so the dev server works against the real database.",
        "Edit any file under src/ and the browser refreshes itself within a second.",
        "When the work is finished, run npm run build so http://localhost:3001 serves the new version too. The running server picks the new files from dist/ up without a restart.",
    ]
)

doc.add_heading("3.3 Reset the demo data", level=2)
numbered(
    [
        "cd server",
        "npm run db:reset",
        "Expect two lines: 'demo data cleared ...' and then 'seed complete: 6 users, 97 reports (97 added this run), ... 6 notifications'.",
        "The next report anyone submits will be #1025, and the seeded references stay #1018 upwards, which is what the smoke test and the demos expect.",
    ]
)
note(
    "A reset deletes everything people submitted while testing, including reports you "
    "submitted yourself from your own window. That is the point of it: run it before a "
    "demo or before the smoke test, and the numbers come out exactly as expected."
)

doc.add_heading("3.4 Run the smoke test", level=2)
numbered(
    [
        "Start the server first (guide 3.1 or the server window you already have open).",
        "For exact-count checks to pass, reset the demo data first: cd server && npm run db:reset.",
        "Open Git Bash in the project root (the script is a bash script).",
        "bash server/smoke-test.sh",
        "Read the output:26 PASS lines and the final ALL SMOKE TESTS PASSED. A FAIL line prints the value the server returned and the value that was expected.",
        "Run npm run db:reset once more if you want the database pristine again afterwards; the test itself creates a report (#1025) and attaches evidence to it.",
    ]
)

doc.add_heading("3.5 Test one endpoint by hand with curl", level=2)
doc.add_paragraph(
    "Sign in and keep the token. From Git Bash in the project root:"
)
code(
    [
        "TOK=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"email\":\"alex@potholepal.test\",\"password\":\"resident123\"}' \\",
        "  | python -c \"import sys,json;print(json.load(sys.stdin)['token'])\")",
    ]
)
doc.add_paragraph("Ask for something that needs the token:")
code(["curl -s http://localhost:3001/api/v1/reports -H \"Authorization: Bearer $TOK\""])
doc.add_paragraph(
    "Check only the status code instead of the body by adding: "
    "-o /dev/null -w '%{http_code}'. A signed-out request should answer 401; with the "
    "token it answers 200."
)
doc.add_paragraph("Submit a report with a photo, as the app does:")
code(
    [
        "curl -s -X POST http://localhost:3001/api/v1/reports \\",
        "  -H \"Authorization: Bearer $TOK\" \\",
        "  -F \"photo=@server/public/favicon-48.png;type=image/png\" \\",
        "  -F \"lat=-26.71\" -F \"lng=27.97\" \\",
        "  -F \"address=Vereeniging, Gauteng, South Africa\" -F \"issueType=Pothole\" \\",
        "  -F \"size=Large\" -F \"depth=Deep\" -F \"traffic=High\" -F \"damage=Yes\" \\",
        "  -F \"description=Test submission from curl.\"",
    ]
)
doc.add_paragraph(
    "-F is one form field; a field that starts with @ sends a file. Submit the same "
    "coordinates again and the server answers 409 with the reference of the report that "
    "already sits there, which is the duplicate guard working."
)

doc.add_heading("3.6 Walk the whole system in a browser", level=2)
numbered(
    [
        "Open http://localhost:3001 and sign in as a resident (section 5).",
        "Report a pothole: Report a Pothole, take or choose a photo, move the pin on the map, fill in the details, review, submit. You land on the new report's details page with its reference number.",
        "Press back: you return to My Reports. This is the behaviour fixed on 21 October. Opening a report from the list, or from the staff queue, still returns to where you came from.",
        "Sign out and sign in with a staff account (or use a second browser window so both sessions stay alive). Advance the report's status in the dashboard or on its details page.",
        "Back in the resident window, the status changes within ten seconds without reloading, and a notification appears.",
        "Keep the developer console open throughout (F12). During a healthy walk it stays quiet apart from checks that are meant to fail, like a deliberate wrong password (401) or a duplicate submission (409).",
        "Screenshot anything worth handing in. The Freebuff preview window does this directly; in a normal browser use the Snipping Tool or Ctrl+Shift+S.",
    ]
)

doc.add_heading("3.7 Lint and build before handing work in", level=2)
numbered(
    [
        "npm run lint. No problems means no output beyond the script banner.",
        "npm run build. Expect the file list and the 'built in ...' line.",
        "Refresh http://localhost:3001 so the new bundle is what you test.",
    ]
)

doc.add_heading("3.8 Regenerate one of the Word documents", level=2)
numbered(
    [
        "Install the library once: pip install python-docx.",
        "From the project root, run the script for the document you want, for example: python docs/build_tools_docx.py",
        "The document appears in docs/. If Word has the old copy open, close it first; otherwise the script writes a copy with -updated in the name so nothing is lost.",
    ]
)

doc.add_heading("3.9 Serve over HTTPS for phone testing", level=2)
numbered(
    [
        "cd server && npm run certs (this needs openssl, which Git Bash provides).",
        "cd server && npm start. A second line appears: 'PotholePal HTTPS on https://localhost:3443 (for phones)'.",
        "On the phone, open https:// followed by the laptop's IP address and :3443, and accept the one-time certificate warning.",
        "Rerun npm run certs whenever the laptop gets a new IP address, for example after moving to a different network.",
    ]
)
note(
    "Phones only allow the live camera and GPS on secure pages, so this is what makes the "
    "real camera step of the report flow work from a phone. On the laptop's own browser, "
    "plain http://localhost is enough."
)

doc.add_heading("3.10 Save the work with Git", level=2)
numbered(
    [
        "git status to see what changed and what is new.",
        "git add followed by the files that belong to this piece of work. Avoid adding everything blindly.",
        "git commit -m \"a short reason\" to record the snapshot.",
        "git log --oneline to see the history when you need to remember what was done when.",
    ]
)

# ---------------------------------------------------------------- 4
doc.add_heading("4. A worked example: verifying the back-button fix", level=1)
doc.add_paragraph(
    "The bug: after submitting a report you land on its details page, but pressing back "
    "returned into the report form, which had already been submitted and was sitting there "
    "empty."
)
doc.add_paragraph(
    "The change: submitting now places My Reports directly behind the details page in the "
    "browser's history, so back returns to the list. Nothing else changed: opening a "
    "report from My Reports or from the staff queue still returns to that list or queue, "
    "because only the submit action rewrites the history."
)
doc.add_paragraph("How it was verified on 21 October, using the tools in this document:")
numbered(
    [
        "npm run lint reported zero problems, and npm run build produced a fresh bundle.",
        "In the browser, signed in as a resident, the whole flow was walked: photo, pin moved away from the seeded reports so the duplicate guard would not trip, details filled in, submit.",
        "The details page of the new report (#1028) opened, and pressing back arrived on My Reports with the new report at the top. The browser's own back button did the same.",
        "Opening an older report from the list and pressing back returned to the list, proving the change only applies after a submission.",
        "The developer console showed only the deliberate 409 from a duplicate submission attempted on the way.",
        "The database was reset, then bash server/smoke-test.sh ran all 26 checks: every one passed.",
    ]
)
doc.add_paragraph(
    "That loop is the pattern for every fix in this project: reproduce it in the browser, "
    "change the code, prove the new behaviour by walking the flow, then run lint, build and "
    "the smoke test so nothing else broke on the way."
)

# ---------------------------------------------------------------- 5
doc.add_heading("5. Accounts for testing", level=1)
doc.add_paragraph(
    "The login page no longer lists these (they were removed for the demo), so they live "
    "here instead."
)
table(
    ["Account", "Password", "Opens"],
    [
        ["alex@potholepal.test", "resident123", "The resident app, with reports already in My Reports"],
        ["staff@potholepal.test", "staff123", "The municipal dashboard"],
        ["nkosi@municipalstaff.com", "staff123", "The municipal dashboard"],
    ],
    [2.4, 1.4, 2.4],
)
doc.add_paragraph(
    "One page handles both sides: the role comes from the account, so a staff sign-in goes "
    "to the dashboard and everything else goes to the resident app."
)
doc.add_paragraph(
    "New residents can register in the app itself. The municipalstaff.com domain is "
    "reserved: a registration from that domain is refused, so nobody can sign up their way "
    "into the portal. Passwords are changed through Forgot password, which shows the "
    "six-digit code on the screen because this demo has no mail server yet."
)

# ---------------------------------------------------------------- save
out = "docs/PotholePal-tools-and-testing.docx"
try:
    doc.save(out)
    print("saved:", out)
except PermissionError:
    alt = "docs/PotholePal-tools-and-testing-updated.docx"
    doc.save(alt)
    print("Word has the file open; saved to:", alt)
