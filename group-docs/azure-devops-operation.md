# Azure DevOps operation

Decided 24 October 2026: put the repository on Azure DevOps, make the phase board live, and run lint and build on every push. Setting it all up takes about half an hour and costs nothing on the student plan; the local setup stays untouched.

State of the repository at the time of writing: nine commits and a clean working tree, with no `.env` file, certificates, uploads or Word lock files tracked by git. Against the committed lockfile, `npm ci`, `npm run lint` and `npm run build` all pass.

## Check first that nothing private is tracked (one minute)

From the project folder:

```
git status
git ls-files | grep -E '(^|/)\.env|certs/|uploads/|~\$'
```

The first command reports a clean working tree. The second prints nothing; if it ever lists a path, that file would be published to Azure on the next push, so take it out of the index first with `git rm --cached <path>` and commit that. Both checks pass as the repository stands.

## Step 1: create the repository and push

1. Sign in at https://dev.azure.com with the student account.
2. Create a project called PotholePal, with Git for version control and Boards, Repos and Pipelines switched on (Tests and Artifacts stay off).
3. Open Repos, then Files, press Clone, and copy the HTTPS URL. It has the shape `https://dev.azure.com/<org>/PotholePal/_git/PotholePal`.
4. From the project folder on the laptop:

```
git remote add origin https://dev.azure.com/<org>/PotholePal/_git/PotholePal
git push -u origin master
```

The first push opens a sign-in window from Git Credential Manager; sign in with the same student account. From then on pushing needs no password, every commit has a URL the four of you can open, and the history no longer exists only on this laptop.

## Step 2: make the phase board live (Boards)

Section 16 of the Phase 1 document (group-docs/TheCityFixTeam-Phase-1.pdf) describes a live task board mapped to the seven phases, still marked "Draft v1" and "to be made live". This step is that, in the portal. Boards costs nothing for you: the Basic plan covers five users, the team is four (Lesiamo, Crystal, Kgosi, Raymond), and everyone signs in with their own Microsoft account so the activity trail carries real names.

1. Open Boards. The board arrives with three default columns (New, Active, Closed). Rename them and add four more, so the columns are the seven phases from left to right:

   - Phase 1: Planning
   - Phase 2: Requirements Analysis
   - Phase 3: System Design
   - Phase 4: Development (Part 1)
   - Phase 5: Development (Part 2)
   - Phase 6: Testing
   - Phase 7: Deployment & Documentation

2. Add a work item for each task from the week-by-week plan in the Phase 1 document (pages 12 to 15): the FR and NFR items (the plan cites FR-01 to FR-10 and NFR-07 by name) plus the tasks listed under each phase. Several of those tasks already carry an owner, so assigning them is transcription.
3. Keep your own card moving: when a task finishes a phase, drag the card over and comment what changed. The dated activity on each item is evidence a marker can open and check, and it beats screenshots pasted into a document the night before submission.

## Step 3: the pipeline (Pipelines)

Add azure-pipelines.yml at the repository root:

```yaml
trigger:
  - master

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "24.x"
    displayName: "Use Node 24"

  - script: npm ci
    workingDirectory: app
    displayName: "Install packages in app/"

  - script: npm run lint
    displayName: "Lint"

  - script: npm run build
    displayName: "Build"
```

Install runs in app/ because that is where the front end and its package-lock.json live; lint and build run at the root, whose package.json forwards both into app/. Those are the same commands that already pass on the laptop: lint clean, build in about ten seconds. The install-script warning npm prints about esbuild is expected and harmless.

Switch it on: Pipelines, then New pipeline, then Azure Repos Git, pick the repository, choose Existing Azure Pipelines YAML file, point it at /azure-pipelines.yml, press Run. The first run takes a couple of minutes while it downloads Node. After that, every push to master gets a green or red result attached to its commit, in about a minute, which is what the testing chapter can point at: this check, on this commit, at this time.

The 48-check smoke suite stays local for now. Putting it in the pipeline means running SQL Server inside the pipeline as a service container, which is a separate piece of setup; until then it runs by hand from the project root: `bash app/server/smoke-test.sh`, expecting 48 of 48.

## What was left out, deliberately

Test Plans moves to the paid tier after its 30-day trial, and the traceability matrix in the document already records the manual tests, so paying for it would duplicate work.

Hosting the running application on Git stops at the front end: Git hosting serves static files, so the built front end could sit on a page host. On its own it could not log in, submit a report or open the staff dashboard; the API and the database would have nowhere to run. The real option arrives in Phase 7 and may cost nothing. The Azure for Students credit (check it on the portal's Subscription page) covers an App Service for the API and an Azure SQL database in the same account as DevOps. Until then the deployment stays the LAN-over-HTTPS demo with the locally generated certificates, which the limitations section already describes honestly.

## Local setup is unchanged

`npm run build`, then `cd app/server && npm start`, then http://localhost:3001. The pipeline only reads the repository; it deploys nothing, and none of the steps above touches the running app.
