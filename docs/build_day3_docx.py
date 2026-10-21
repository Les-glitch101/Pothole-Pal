"""Build docs/PotholePal-day3-fixes.docx.

Re-run after editing the content below:  python docs/build_day3_docx.py
"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

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


def shot(path, caption, width=4.4):
    doc.add_picture(path, width=Inches(width))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(caption)
    run.italic = True
    run.font.color.rgb = GREY
    run.font.size = Pt(9)


# ---------------------------------------------------------------- title
title = doc.add_heading("PotholePal: day three, the bug list", level=0)
title.runs[0].font.color.rgb = BLUE
sub = doc.add_paragraph()
run = sub.add_run(
    "Wednesday 21 October 2026  \u00b7  The City Fix Team (Lesiamo, Crystal, Kgosi, Raymond)"
)
run.font.color.rgb = GREY
run.font.size = Pt(10)

doc.add_paragraph(
    "This document answers the issue list in \"A few issues and bugs needed to be "
    "handled.docx\", plus the location problem reported after that list was written and "
    "the phone testing question. Every fix below was clicked through in the browser "
    "today, and the checks at the end were all run after the last file was saved."
)

# ---------------------------------------------------------------- overview
doc.add_heading("What was done, in one look", level=1)
table(
    ["Issue raised", "What changed"],
    [
        [
            "Map dots do nothing when tapped (home page and map page)",
            "Every dot now opens that report's details page. Works on both maps.",
        ],
        [
            "Home page says \"Vereeniging, Gauteng\" with a down arrow",
            "Reads \"Emphuleni District\" now, arrow removed.",
        ],
        [
            "Equalizer symbol above the map search bar",
            "Removed. The filter chips under the search already do that job.",
        ],
        [
            "Cog button on the notifications page",
            "Removed.",
        ],
        [
            "Profile page: dead cog, My Impact, Leaderboard, Settings, "
            "Help and Support, Municipality portal",
            "All removed. What is left (My Reports, Sign out) works. The staff "
            "portal still exists at the /staff address for the demo.",
        ],
        [
            "Photo step should use the phone's real camera, with flip and flash",
            "The viewfinder is now a live camera feed. Flip swaps front and back, "
            "the flash button turns the torch on where the device has one, and the "
            "shutter takes the picture.",
        ],
        [
            "Location map inaccurate, edit location dead, live location ignored",
            "Step 2 is a real map with a draggable pin, a \"Use my current "
            "location\" button, an address that is worked out from wherever the pin "
            "sits, and a Confirm Location button that now does something.",
        ],
        [
            "Reports labelled Three Rivers or Duncanville sit in Vereeniging on "
            "the map; report locations do not match the live map",
            "Suburb coordinates were re-sourced from OpenStreetMap and every "
            "report address now names its own suburb. Details below.",
        ],
        [
            "Users outside Emphuleni should see a message",
            "Drop the pin outside the district on step 2 and a message appears and "
            "Confirm Location stays switched off.",
        ],
        [
            "Phone testing did not work",
            "The laptop is on a new network, so the address changed, and the "
            "firewall rule from yesterday was gone. Both are fixed, and there is a "
            "new https address so the camera and live location work on the phone. "
            "Full steps in the phone section.",
        ],
        [
            "Register, forgot password, one login for both sides (asked for after "
            "sign-off)",
            "New screens at /register and /forgot, and /login now sends staff to "
            "the municipal dashboard and residents to the app based on their "
            "account. The separate staff login page is gone.",
        ],
    ],
    widths=[2.6, 4.2],
)

# ---------------------------------------------------------------- markers
doc.add_heading("Map dots open the report", level=1)
doc.add_paragraph(
    "The map component now takes an id with each dot and a callback for when it is "
    "tapped. Home passes the resident's list and the map page passes its filtered "
    "list; both send you to the same report details screen you reach from My Reports. "
    "The dots got a pointer cursor so they read as tappable."
)
bullets([
    "Test it: on the home page or the map page, tap any coloured dot.",
    "Expected: that report's details screen opens, photo and progress timeline "
    "included.",
])
shot(
    "screenshots/day3-marker-details.png",
    "Tapping a dot opens the full report (this one from the home map).",
)

# ---------------------------------------------------------------- chrome
doc.add_heading("Dead controls removed", level=1)
doc.add_paragraph(
    "The rule the team agreed on: nothing on the screen that looks clickable but is "
    "not. The notifications cog, the profile cog, the four dead profile rows and the "
    "municipality portal button are gone, and the map page header lost the equalizer "
    "button. The profile menu keeps My Reports, which leads somewhere, and Sign out."
)
note(
    "The staff portal was not deleted, only its entry point on the profile page. "
    "For the demo it opens at http://localhost:3001/staff (or /staff on any address "
    "the app is served from)."
)
shot(
    "screenshots/day3-profile.png",
    "Profile page after the cleanup: working rows only.",
)
shot(
    "screenshots/day3-notifications.png",
    "Notifications header without the cog.",
)

# ---------------------------------------------------------------- camera
doc.add_heading("The camera step is a real camera", level=1)
doc.add_paragraph(
    "Step 1 asks the browser for the device camera and shows the live feed in the "
    "viewfinder. The shutter copies the current frame into a JPEG and carries on with "
    "the flow. The front camera view is mirrored so a selfie looks the same on screen "
    "and in the saved photo."
)
table(
    ["Control", "Behaviour"],
    [
        ["Shutter", "Captures the live frame and moves to step 2."],
        ["Flip", "Switches between the back and front cameras."],
        ["Flash", "Turns the torch on during the shot. Phones that expose a torch "
                  "(Android Chrome) light up; devices without one show the button "
                  "greyed out instead of failing."],
        ["Gallery", "Picks an existing photo from the device, same as before."],
        ["Continue with sample photo", "Still there for laptops with no camera."],
    ],
    widths=[1.8, 5.0],
)
doc.add_paragraph(
    "If the camera cannot run, the viewfinder says so in one line: permission "
    "refused, no camera on the machine, or a page opened over plain http. The "
    "gallery, the shutter's built-in photo picker and the sample button keep the "
    "flow moving either way. The live feed itself was tested today on this laptop: "
    "the picture appeared in the viewfinder, and flip and shutter both worked. The "
    "camera on a phone needs the https address further down."
)
shot(
    "screenshots/day3-camera.png",
    "The blocked-camera message with the fallbacks underneath it.",
)

# ---------------------------------------------------------------- location step
doc.add_heading("Step 2: a location you can actually edit", level=1)
doc.add_paragraph(
    "The old step 2 showed a Google embed you could not touch, with a Confirm button "
    "that did nothing. It is now the same map component the rest of the app uses, with "
    "a pin you can drag anywhere and a map you can tap to move it."
)
bullets([
    "The address under the map always comes from the pin. Move the pin and the label "
    "follows: the nearest known suburb appears immediately, then OpenStreetMap's "
    "reverse geocoder replaces it with the street address when it answers.",
    "\"Use my current location\" drops the pin on the device's GPS position, so a "
    "phone opens on the spot the reporter is standing on.",
    "Confirm Location saves the pin and address into the draft and moves to step 3. "
    "The pencil next to Location on the review page leads back here.",
    "Precise location needs the browser to allow it; if it is refused, the page says "
    "which button to use instead and the pin still works.",
])
shot(
    "screenshots/day3-location-step.png",
    "The rebuilt location step: draggable pin, address from the pin, live location button.",
)

doc.add_heading("The district message", level=2)
doc.add_paragraph(
    "Step 2 checks every pin position against the Emphuleni District. A pin outside "
    "the district puts an amber message at the top of the page and keeps Confirm "
    "Location switched off; moving the pin back inside clears it. The same check runs "
    "on the position that comes back from \"Use my current location\", so a reporter "
    "standing in Johannesburg or the Free State gets the message before they can "
    "submit anything."
)
shot(
    "screenshots/day3-district-gate.png",
    "Pin dropped south of the Vaal: the message appears and Confirm Location is disabled.",
)

# ---------------------------------------------------------------- coordinates
doc.add_heading("Report locations now match the map", level=1)
doc.add_paragraph(
    "Two things were wrong. The suburb coordinates in the seed data were guesses, and "
    "several of them pointed at the middle of Vereeniging, so a report named Three "
    "Rivers or Sonland Park dropped its dot in the wrong town. On top of that every "
    "report row carried the same address, \"Vereeniging, Gauteng, South Africa\", no "
    "matter which suburb it belonged to, which is why the details page contradicted "
    "the map."
)
doc.add_paragraph(
    "The seven suburb positions were looked up in OpenStreetMap (Nominatim for most, "
    "the raw Overpass data for the rest) on 21 October 2026. The movement per suburb:"
)
table(
    ["Suburb", "Old point", "New point", "What the fix corrects"],
    [
        ["Three Rivers", "-26.6639, 27.9219", "-26.6547, 27.9781",
         "Was about 6 km west, inside Vereeniging"],
        ["Three Rivers East", "-26.6561, 27.9104", "-26.6636, 27.9997",
         "Was about 9 km west"],
        ["Sonland Park", "-26.6803, 27.9386", "-26.6092, 27.9089",
         "Was about 8 km south, in Vereeniging"],
        ["Duncanville", "-26.6889, 27.9361", "-26.6542, 27.9299",
         "Was about 4 km south"],
        ["Arcon Park", "-26.6702, 27.9472", "-26.6331, 27.9433",
         "Was about 4 km south"],
        ["Peacehaven", "-26.6961, 27.9495", "-26.6633, 27.9486",
         "Was about 3.6 km south"],
        ["Riverview", "-26.6572, 27.9331", "-26.7381, 27.8493",
         "Was about 10 km north-east of the real place"],
    ],
    widths=[1.4, 1.5, 1.5, 2.4],
)
doc.add_paragraph(
    "The address rule changed with it. Designed reports, the 90 synthetic rows and the "
    "fallback for a submission with no address all read \"<Suburb>, Emphuleni "
    "District, Gauteng\" now, so the heading, the address line and the dot on the map "
    "name the same place. The 90 synthetic dots are still scattered around their "
    "suburb centre, so each cluster sits on its own label."
)
doc.add_paragraph(
    "The same coordinates drive the server's nearest-suburb rule, so a new report "
    "submitted near Three Rivers gets labelled Three Rivers, not Vereeniging."
)
shot(
    "screenshots/day3-three-rivers.png",
    "After the reseed: dots spread over the real suburb positions instead of one blob "
    "in Vereeniging (Sonland Park north, Three Rivers east, Riverview south-west).",
)
shot(
    "screenshots/day3-report-address.png",
    "A report's heading, address and map position now say the same suburb.",
)

# ---------------------------------------------------------------- browser
doc.add_heading("Running it in the browser", level=1)

doc.add_heading("Demo mode: one process, use this for the presentation", level=2)
code([
    "npm run build",
    "cd server && npm start",
    "http://localhost:3001",
])
doc.add_paragraph(
    "That build makes the front end, and the server then serves both the app and the "
    "API from one address. Deep links such as /map or /report-details/1024 load "
    "correctly. Wait for these two lines before signing in:"
)
code([
    "PotholePal API on http://localhost:3001 (db: PotholePal)",
    "PotholePal HTTPS on https://localhost:3443 (for phones)",
])

doc.add_heading("Development mode: hot reload, two terminals", level=2)
code([
    "Terminal 1:  cd server && npm start     (API on 3001)",
    "Terminal 2:  npm run dev                (front end on 5173)",
    "http://localhost:5173",
])
doc.add_paragraph(
    "Vite forwards /api and /uploads to the server. Use this while editing the front "
    "end, and demo mode on the day."
)

doc.add_heading("Sign-ins and the two-sided demo", level=2)
table(
    ["Who", "Where to sign in", "Credentials"],
    [
        ["Resident", "/login", "alex@potholepal.test / resident123"],
        ["Staff, portal owner", "/login", "staff@potholepal.test / staff123"],
        ["Staff, second account", "/login", "nkosi@municipalstaff.com / staff123"],
    ],
    widths=[1.7, 1.5, 3.6],
)
doc.add_paragraph(
    "One page serves both sides: the role stored on the account decides whether you "
    "continue into the resident app or the municipal dashboard, so there is no second "
    "portal address to remember. New residents register from that same page and any "
    "user can recover a password from it. Open the resident side in one browser and "
    "the staff side in another (Chrome and Edge, for example). A status change on the "
    "staff side reaches the resident screen within ten seconds without a reload."
)

# ---------------------------------------------------------------- accounts
doc.add_heading("Accounts: sign up, password reset, one login", level=1)
doc.add_paragraph(
    "Three account features were added after the bug list was signed off. Between them "
    "they change how everyone gets in."
)
bullets([
    "Register (the Create an account link on the login page, or /register) asks for "
    "a name, an email and a password with a confirm field, creates the account and "
    "signs the person straight in. The server forces the resident role and refuses "
    "the municipalstaff.com domain, so nobody can register their way into the "
    "municipal portal, and passwords are hashed with bcrypt before they touch the "
    "database.",
    "Forgot password (/forgot) asks for the email, then shows a six digit code in a "
    "panel that says plainly it is demo mode with no email service connected. The "
    "code is stored as a hash. It expires after 15 minutes and can only be used "
    "once. Entering it with a new password signs the user in on the spot and ends "
    "every other session for "
    "that account. Connecting a real mail service later means sending that same code "
    "by email; the endpoint already hands it back in the response.",
    "One login (/login) serves residents and staff. The role in the database decides "
    "the destination, so nkosi@municipalstaff.com with staff123 and "
    "staff@potholepal.test with staff123 both open the municipal dashboard, while "
    "alex@potholepal.test with resident123 opens the resident app. The old staff "
    "login page was deleted, and visiting /staff without a staff session redirects "
    "to /login.",
    "Every password field carries an eye button that shows or hides what was typed, "
    "on the login, register and reset screens.",
    "A wrong password now prints its message inside the form. Before this change the "
    "page quietly reloaded and the message was lost.",
])
shot(
    "screenshots/day3-register-page.png",
    "The registration screen, with the eye buttons on both password fields.",
)
shot(
    "screenshots/day3-forgot-code.png",
    "Password reset step two: the demo code panel, the code field and the new password.",
)
shot(
    "screenshots/day3-unified-staff-dashboard.png",
    "Staff credentials typed into the one login page land on the municipal dashboard.",
)

# ---------------------------------------------------------------- phone
doc.add_heading("Testing it on your phone", level=1)
doc.add_paragraph(
    "Yesterday's address stopped working because the laptop joined a different "
    "network: the Wi-Fi is now MTN-5G-9C43F5 and the laptop's address is 192.168.0.187, "
    "not the 192.168.1.221 from the old instructions. The firewall rule from yesterday "
    "was gone with it. Both are back, and there is one more piece: browsers only "
    "switch on the camera and precise location on a secure page, and an address like "
    "http://192.168.0.187 is not one. The server now also listens on https, so use the "
    "https address from the phone."
)
numbered([
    "Put the phone and the laptop on the same Wi-Fi (not mobile data, not a guest "
    "network).",
    "On the laptop, if the server is not already running: npm run build, then "
    "cd server && npm start.",
    "On the phone, open https://192.168.0.187:3443",
    "The browser warns about the certificate the first time. That warning is expected: "
    "the certificate is generated locally for this laptop. On Android Chrome tap "
    "Advanced, then Proceed to 192.168.0.187 (unsafe). On iPhone Safari tap Show "
    "Details, then visit this website. The browser remembers the choice.",
    "Sign in with alex@potholepal.test / resident123 and test the flow. The live "
    "camera and precise location both run on this address.",
    "Add it to the home screen for an app icon: Safari's Share button then Add to "
    "Home Screen, or Chrome's menu then Add to home screen.",
])
note(
    "The phone still not opening the page? Check in this order: same Wi-Fi, "
    "server running (both lines in its log), and the laptop's current address from "
    "ipconfig (IPv4 under the Wi-Fi adapter). The firewall rule covering both ports is "
    'netsh advfirewall firewall show rule name="PotholePal demo".'
)
note(
    "A changed address means one command: npm run certs inside server/ from Git "
    "Bash, then start the server again. Regenerate whenever the browser says the "
    "certificate does not cover the address you opened."
)

doc.add_heading("Alternatives when https is in the way", level=2)
bullets([
    "http://192.168.0.187:3001 still works for browsing the app on the phone. The "
    "browser keeps the live camera and precise location off on plain http, so use "
    "Gallery for the photo and drag the pin to set the location. Everything else is "
    "identical.",
    "Test the camera and live location on the laptop instead: they work at "
    "http://localhost:3001 because browsers trust their own machine.",
    "Routers that isolate wireless clients stop the two from seeing each other. In "
    "that case, connect the laptop to the phone's hotspot, run ipconfig for the new "
    "address and open that from the phone.",
])

# ---------------------------------------------------------------- checks
doc.add_heading("What was verified today", level=1)
table(
    ["Check", "Result"],
    [
        ["eslint (npm run lint)", "0 errors, 0 warnings"],
        ["vite build (npm run build)", "Succeeded, app bundle 478 kB"],
        ["API smoke suite (server/smoke-test.sh, from the project root)",
         "26 of 26 passed"],
        ["Login, resident and staff", "Passed in the browser"],
        ["Dot opens report details", "Passed on home map and map page"],
        ["Dead controls removed", "Notifications, profile and map headers checked "
                                  "in the browser"],
        ["Live camera, flip, shutter", "Live feed shown and captured on this laptop"],
        ["Camera blocked fallback", "Message and gallery/sample buttons shown"],
        ["Pin drag, address follows pin", "Passed, street addresses returned by "
                                          "OpenStreetMap"],
        ["Use my current location", "Error path shown in this browser; works on a "
                                    "normal phone or laptop browser"],
        ["District message and disabled confirm", "Passed, pin south of the Vaal"],
        ["Confirm Location to step 3", "Passed, photo carried across"],
        ["Report addresses match their suburb", "Passed, e.g. report #20 reads "
                                                "Three Rivers in all three places"],
        ["Console after the final build", "No errors"],
        ["http://localhost:3001", "200"],
        ["https://localhost:3443", "200"],
        ["http://192.168.0.187:3001 and https://192.168.0.187:3443", "200 and 200"],
        ["Firewall rule PotholePal demo", "Ports 3001 and 3443, inbound allow, all "
                                          "profiles"],
        ["Database after reset", "97 reports (ids 1-90 and 1018-1024), next report "
                                 "#1025, 6 notifications, 6 accounts"],
        ["Register endpoint (curl)", "201 for a new resident, 409 for a duplicate "
                                     "email, 400 for short passwords and the "
                                     "reserved staff domain"],
        ["Reset endpoint (curl)", "Code delivered in 6 digits, wrong code 400, right "
                                 "code 200 and signed in, code reuse 400, old "
                                 "password 401, new password 200"],
        ["Unified login (curl and browser)", "nkosi@municipalstaff.com and "
                                             "staff@potholepal.test both return role "
                                             "staff and land on the dashboard; "
                                             "alex returns role resident"],
        ["Browser walkthrough", "Register lands on the home screen, reset signs the "
                               "user straight in, /staff without a session redirects "
                               "to /login, eye toggles the field, wrong password "
                               "shows inline without a reload"],
    ],
    widths=[3.0, 3.8],
)

doc.add_heading("Known limits worth saying out loud in Q and A", level=1)
bullets([
    "The flash button depends on the device exposing a torch. Android phones do; most "
    "laptops do not, and the button shows as disabled there.",
    "The district edge is a straight bounding box around the municipality, not the "
    "official boundary polygon. A pin within a kilometre of the border can read "
    "either way; points a few kilometres out, like Johannesburg or the Free State, "
    "are caught correctly.",
    "Address lookup uses OpenStreetMap's free reverse geocoder, so the phone or "
    "laptop needs internet. Offline, the nearest suburb label appears straight away "
    "instead.",
    "Sessions live in the server's memory. Restarting the server signs everyone out, "
    "which is also why the demo should start the server before anyone logs in.",
    "The district message appears on the location step of a report. The app does not "
    "ask for location the moment it opens.",
    "There is no Android package yet; the phone test is the browser with a home "
    "screen icon.",
    "Password reset codes appear on screen rather than by email, because this demo "
    "has no mail service. The panel says so, and swapping in a mail provider is a "
    "small change to one endpoint.",
])

try:
    doc.save("docs/PotholePal-day3-fixes.docx")
    print("wrote docs/PotholePal-day3-fixes.docx")
except PermissionError:
    # The document is open in Word or a viewer: write beside it, and rerun this
    # script once it is closed to replace the main file.
    doc.save("docs/PotholePal-day3-fixes-updated.docx")
    print(
        "PotholePal-day3-fixes.docx is open somewhere; "
        "wrote docs/PotholePal-day3-fixes-updated.docx instead. "
        "Close it and rerun to replace the main file."
    )
