# Orbit � Build Plan

MVP build sequence in recommended order. Each step has a clear scope, test checklist, and done criteria. Steps are designed to produce a working, testable increment at each stage � nothing blocks the next step unless explicitly noted.

**Firebase:** The production project **`orbit-oaklin`** uses **Firestore in London** (**`europe-west2`**). When configuring **Vercel**, prefer a **European** Serverless region (e.g. **London `lhr1`** or **Frankfurt `fra1`**) so API routes and server actions stay close to the database.

Dependencies are noted where a step cannot begin until a prior step is complete.

---

## Step 1 � Project Scaffold

**Depends on:** Nothing

### What to Build
- Initialise a Next.js 14 project using the App Router (`npx create-next-app@14`)
- Install and configure Tailwind CSS (with the Orbit brand colour tokens in `tailwind.config.ts`)
- Install Firebase SDK (`firebase`) and initialise `lib/firebase.ts` with Firestore and Auth exports
- Install Anthropic SDK (`@anthropic-ai/sdk`) � server-side use only
- Create the following top-level folder structure:
  ```
  app/
    (admin)/          ? Oaklin admin routes (auth-gated)
    (manager)/        ? Team manager dashboard routes (auth-gated)
    survey/           ? No-login survey routes (token-gated)
    api/              ? Server-side route handlers (AI calls, token validation)
  components/
  lib/
    firebase.ts
    firebase-admin.ts ? Firebase Admin SDK for server-side writes
    claude.ts         ? Anthropic client initialisation
  types/              ? TypeScript interfaces for all Firestore documents
  ```
- Set up `.env.local` with placeholder keys:
  - `NEXT_PUBLIC_FIREBASE_*` (client config)
  - `FIREBASE_ADMIN_*` (service account for server-side)
  - `ANTHROPIC_API_KEY`
- Add a `README.md` with local setup instructions
- Configure Vercel project linked to GitHub repository; set the **Serverless Function region** to **London (`lhr1`)** or another **EU** region to align with Firestore in **`europe-west2`**

### What to Test
- `npm run dev` starts without errors
- `npm run build` completes without errors
- Tailwind brand colours render correctly on a placeholder `/` page
- Firebase client initialises without errors in browser console

### Done Criteria
- Project builds and runs locally
- All environment variable placeholders documented
- Folder structure matches specification
- Deployed to Vercel preview URL from GitHub

---

## Step 2 � Firebase Authentication and Role Middleware

**Depends on:** Step 1

### What to Build
- Enable Firebase Authentication (email/password provider) in the Firebase console
- Create a `lib/auth.ts` helper that reads the current user's `role` from the `users` Firestore collection
- Implement Next.js middleware (`middleware.ts`) that:
  - Protects `/admin/*` routes � redirects to `/login` if unauthenticated or role is not `oaklin_admin`
  - Protects `/dashboard/*` routes � redirects to `/login` if unauthenticated or role is not `team_manager`
  - Allows `/survey/*` routes through without authentication
- Create a shared login page at `/login` (email/password form, Firebase `signInWithEmailAndPassword`)
- Create a logout action (server action or API route that clears the session)
- Create a Firebase Admin SDK instance (`lib/firebase-admin.ts`) for server-side token verification
- Implement session cookie approach: on login, exchange Firebase ID token for a short-lived session cookie via a `/api/auth/session` route handler (so auth state survives SSR)
- Define TypeScript types for `UserRole` and the `users` Firestore document shape (in `types/`)

### What to Test
- Unauthenticated access to `/admin` redirects to `/login`
- Unauthenticated access to `/dashboard` redirects to `/login`
- `/survey/*` routes are accessible without login
- Logging in as an `oaklin_admin` user redirects to `/admin`
- Logging in as a `team_manager` user redirects to `/dashboard`
- Logging in as the wrong role shows an appropriate error
- Session persists across page refresh

### Done Criteria
- Route protection is enforced at middleware level
- Role-based redirects work correctly for both admin and manager roles
- Session cookie auth works with SSR pages
- A seed script or manual Firestore entry can create the first Oaklin admin user

---

## Step 3 � Oaklin Admin Portal: Organisations and Teams

**Depends on:** Step 2

### What to Build
- Admin layout (`app/(admin)/layout.tsx`) with sidebar navigation: Organisations, Teams, Engagements, Questions, Benchmarks
- **Organisations list page** (`/admin/organisations`): table of all organisations with name, industry, team count, created date
- **Create organisation form** (`/admin/organisations/new`): fields for name and industry (dropdown of predefined industry options)
- **Organisation detail page** (`/admin/organisations/[id]`): shows org details and list of teams within it
- **Teams list** (within organisation detail): team name, function, size, manager name, status
- **Create team form** (`/admin/organisations/[id]/teams/new`): fields for team name, function (back/middle/front), size, and manager email
  - On submit: creates the `teams` document in Firestore, then triggers Firebase Admin SDK to create a Firebase Auth user for the manager with a temporary password and sends an email invitation (see Step 6 for full email flow � for now, create the user and log the invite link)
  - Creates the `users` document for the team manager with role `team_manager` and `organisationId`
- Firestore security rules (initial version): admins can read/write all collections; managers scoped to their data

### What to Test
- Creating an organisation writes to Firestore and appears in the list
- Creating a team writes to Firestore, creates a Firebase Auth user, and creates a `users` doc
- The organisation detail page only shows teams belonging to that organisation
- Navigating between admin pages works correctly
- Non-admin users cannot access `/admin/*` routes

### Done Criteria
- Oaklin admin can create an organisation and teams end-to-end through the UI
- Manager Firebase Auth accounts are created programmatically
- Firestore contains valid `organisations`, `teams`, and `users` documents
- Admin portal is fully protected by role middleware

---

## Step 4 � Question Bank Seeding and Admin View

**Depends on:** Step 3

### What to Build
- A seed script (`scripts/seed-questions.ts`) that writes the full Oaklin question bank to the `questions` Firestore collection. Each question document includes:
  - `version`, `competency`, `role`, `order`, `text`, `criteria` (map of score 1�5 descriptions), `isActive: true`
- Define the initial question set across three competencies (People & Relationships, Growth & Impact, Purpose & Alignment), with manager-only, member-only, and shared variants. Aim for approximately 5�8 questions per competency per role to start.
- **Questions admin page** (`/admin/questions`): read-only table of all questions, filterable by competency and role
- Display question text, competency, role, order, and active status
- Add a simple toggle to mark a question as inactive (soft disable without deletion)
- Define the `questionSetVersion` constant (e.g. `"v1"`) used when creating engagements

### What to Test
- Seed script runs without errors and writes the expected number of documents
- Questions page displays all seeded questions
- Filter by competency and role works correctly
- Toggling a question inactive updates the Firestore document
- Inactive questions do not break survey rendering (tested at survey step)

### Done Criteria
- All questions are seeded in Firestore with correct structure
- Admin can view the full question bank
- `questionSetVersion` is defined and ready for use in Step 5
- TypeScript type for the `questions` document shape is defined in `types/`

---

## Step 5 � Engagement Creation and Token Generation

**Depends on:** Steps 3 and 4

### What to Build
- **Engagements list page** (`/admin/engagements`): table of all engagements across all teams, with team name, org, status, respondent completion count, created date
- **Create engagement form** (`/admin/engagements/new`): select organisation ? select team ? confirm. On submit:
  - Generate a `memberShareToken` (cryptographically random UUID or similar)
  - Generate a `managerSurveyToken` (separate random token)
  - Write the `engagements` document with `status: "draft"`, both tokens, `questionSetVersion`, and timestamps
- **Engagement detail page** (`/admin/engagements/[id]`):
  - Shows engagement metadata (team, org, status, dates)
  - Shows the shareable member survey URL: `{baseUrl}/survey/member?token={memberShareToken}`
  - Shows the manager survey URL: `{baseUrl}/survey/manager?token={managerSurveyToken}`
  - Shows a respondent completion table (populated in Step 8)
  - Activate button: changes status from `draft` to `active`
  - Close button: changes status from `active` to `closed` (triggers analysis in Step 9)
- A utility function `lib/tokens.ts` for generating and validating tokens

### What to Test
- Creating an engagement writes to Firestore with both tokens
- Survey URLs are correctly constructed and displayed
- Activating an engagement updates status to `active`
- Closing an engagement updates status to `closed`
- Each engagement has unique tokens (verify by creating two and comparing)
- Only Oaklin admins can create or close engagements

### Done Criteria
- Oaklin admin can create, activate, and close engagements through the UI
- Both survey tokens are generated and stored correctly
- Survey URLs are accessible and display correctly (even if survey UI is not yet built)
- Engagement status transitions work correctly

---

## Step 6 � Survey Email Invitations

**Depends on:** Step 5

### What to Build
- Choose and integrate a transactional email provider. Recommended: **Resend** (`resend` npm package) � simple API, Next.js-friendly, generous free tier
- Add `RESEND_API_KEY` to environment variables
- Create a `lib/email.ts` module with functions:
  - `sendManagerDashboardInvite(email, name, dashboardUrl)` � sent when a team is created; directs manager to set their password and access their dashboard
  - `sendMemberInvite(email, name, surveyUrl)` � sent for individually invited team members
- **Invite members UI** on the engagement detail page (`/admin/engagements/[id]`):
  - "Invite members individually" section: input fields for name + email, add multiple rows, then send
  - On submit: for each invited member, create a respondent doc with a unique `inviteToken`, then call `sendMemberInvite`
  - The individual invite URL format: `{baseUrl}/survey/member?token={inviteToken}&respondentId={respondentId}`
  - "Share link" section: displays the `memberShareToken` URL with a copy button
- Re-send invite capability (regenerates token, sends new email)

### What to Test
- Inviting a member creates a `respondents` document with `status: "invited"`
- Email is delivered to the specified address with the correct survey URL
- The survey URL resolves (even if survey UI is not yet built)
- The copy button copies the shareable link to clipboard
- Manager dashboard invite email contains a valid link
- Re-sending an invite updates the token and sends a new email

### Done Criteria
- Individual member email invitations work end-to-end
- Shareable link is displayed and copyable
- Respondent documents are created in Firestore for each email invite
- Manager receives their dashboard invitation email

---

## Step 7 � Survey UI (No-Login)

**Depends on:** Steps 4, 5, and 6

### What to Build
- **Survey routing**: `/survey/member` and `/survey/manager` � both are token-gated, no authentication required
- **Token validation** (server-side, in a route handler or Server Component):
  - For shared link (`memberShareToken`): look up the engagement by token, verify status is `"active"`, proceed
  - For individual invite (`inviteToken`): look up the respondent by token, verify the engagement is active, proceed
  - For manager survey (`managerSurveyToken`): look up the engagement by token, verify status is `"active"`, proceed
  - Invalid or expired tokens render an error page
- **Survey start screen**: respondent name entry (required for shared-link members; pre-filled for email invitees), brief intro, start button. Creates or updates the `respondents` doc with `status: "in_progress"`.
- **Survey question screen**:
  - Questions fetched server-side, filtered by the correct role (manager or member) and `isActive: true`, ordered by competency then `order`
  - Display grouped by competency section (one section at a time, with a section progress indicator)
  - Each question shows the question text and a 1�5 score selector
  - Each score option displays the criterion description for that score level on hover or tap
  - Progress bar at the top showing overall completion percentage
  - "Save and continue" persists answers to Firestore as the respondent progresses (partial saves)
- **Survey completion screen**: thank-you message, Oaklin branding, prompt to contact Oaklin for next steps
- On final submission: update `respondents` doc to `status: "completed"` and set `completedAt`
- Visual design: Orbit brand colours, Arial font, full-screen minimal layout, no navigation sidebar

### What to Test
- Valid shared-link token renders the survey
- Valid individual invite token renders the survey with name pre-filled
- Invalid token renders a clear error page
- Questions render for the correct role (manager sees manager questions; member sees member questions)
- Selecting a score and advancing saves the response to Firestore
- Refreshing mid-survey restores progress (saved answers are re-loaded)
- Completing the survey updates respondent status to `completed`
- Survey is inaccessible if the engagement status is not `active`
- Survey renders correctly on mobile

### Done Criteria
- Both manager and member survey flows work end-to-end
- Responses are correctly written to the `responses` sub-collection
- Respondent status updates correctly on start and completion
- Token validation prevents access to wrong or inactive surveys
- Survey UI matches Orbit brand guidelines

---

## Step 8 � Response Storage and Completion Tracking

**Depends on:** Step 7

### What to Build
- A server-side API route (`/api/survey/respond`) that:
  - Accepts a token, respondent ID, question ID, and score
  - Validates the token server-side before writing
  - Writes or overwrites the response document at `engagements/{id}/respondents/{respondentId}/responses/{questionId}`
  - Updates `respondents` document `status` to `in_progress` if not already set
- Update the survey UI (Step 7) to call this route on each answer rather than writing to Firestore directly from the client (removes the need for permissive client-side Firestore rules)
- **Completion tracking on the engagement detail page** (`/admin/engagements/[id]`):
  - Show a respondent table: name (or "Anonymous member"), role, access method, status, completion date
  - Show aggregate counts: e.g. "1 manager completed, 8/12 members completed"
  - Live or on-refresh update (no need for real-time listeners at this stage)
- Update Firestore security rules to remove any client-side write permissions for responses (all writes go through the server API route)

### What to Test
- Submitting a survey answer calls the API route and writes to Firestore
- Re-answering a question overwrites the previous response
- The respondent table on the admin engagement page updates correctly
- Completion counts are accurate
- Firestore security rules prevent direct client-side writes to `responses`
- The API route rejects requests with invalid tokens

### Done Criteria
- All survey responses flow through the server-side API route
- Firestore security rules are tightened to server-write-only for responses
- Admins can see real-time completion status on the engagement detail page
- TypeScript types for all response-related documents are complete

---

## Step 9 � Survey Closure and AI Analysis (Claude)

**Depends on:** Steps 7 and 8

### What to Build
- A server-side API route (`/api/engagements/[id]/analyse`) that is called when an Oaklin admin clicks "Close and Analyse" on the engagement detail page:
  1. Sets engagement `status` to `"closed"`
  2. Fetches all completed `respondents` and their `responses` from Firestore
  3. Fetches the relevant `questions` documents (to get question text and competency mappings)
  4. Fetches the benchmark document matching the team's industry + function + size (Step 10 builds this fully; use a placeholder for now if benchmarks are not yet seeded)
  5. Constructs a structured prompt for Claude containing:
     - Org/team context (industry, function, size)
     - All questions with their competency labels
     - All responses organised by role (manager vs member) and competency
     - Benchmark figures (or "not available" if not yet seeded)
  6. Calls Claude (`claude-3-5-sonnet` or latest available) and parses the response as JSON:
     - `competencyScores`, `managerScores`, `memberScores`
     - `aiSummary`, `keyStrengths`, `quickWins`, `strategicInitiatives`
     - `benchmarkComparison` (if benchmark data was available)
  7. Writes the `insights` document to Firestore
  8. Writes individual `actionItems` documents (one per quick win and strategic initiative)
  9. Sets engagement `status` to `"analysed"` and updates `analysedAt`
- Add a loading/processing state on the admin UI while analysis runs (it may take 10�30 seconds)
- Add error handling: if Claude call fails, status remains `"closed"` and admin can retry
- Store the Claude model version in the `insights` document for auditability

### What to Test
- Clicking "Close and Analyse" triggers the API route
- All respondent responses are correctly fetched and structured
- Claude returns a valid JSON response (test with a mock engagement of 2�3 respondents)
- `insights` document is written with all required fields
- `actionItems` documents are created (verify count matches quickWins + strategicInitiatives)
- Engagement status transitions to `"analysed"`
- If the Claude call fails, an appropriate error message is shown and engagement status stays `"closed"`
- Prompt structure correctly separates manager from member responses

### Done Criteria
- End-to-end analysis pipeline works from engagement closure to Firestore write
- `insights` and `actionItems` documents contain valid, structured AI-generated content
- Error states are handled gracefully
- The Claude prompt is tested with realistic dummy data and produces sensible output

---

## Step 10 � Benchmark Seeding and Comparison

**Depends on:** Step 9 (the benchmark data is referenced in the analysis prompt)

### What to Build
- A seed script (`scripts/seed-benchmarks.ts`) that writes `benchmarks` documents to Firestore, covering the key industry � function � size combinations Oaklin has data for. Use the composite document ID format: `{industry}__{function}__{sizeRange}` (underscores, lowercased)
- Define the industry list (should match the dropdown in the create organisation form from Step 3) and size ranges (`1-10`, `11-25`, `26-50`, `51+`)
- For combinations where Oaklin does not have static data: add a supplementary Claude call within the analysis route (Step 9) that generates plausible benchmark figures based on the industry and function context, marks them as `source: "ai_supplemented"`, and writes them to `benchmarks` so they are not regenerated on subsequent analyses
- **Benchmarks admin page** (`/admin/benchmarks`): table showing all seeded benchmarks, filterable by industry and function. Allows Oaklin admins to view and edit individual benchmark figures.
- Update the `insights` document structure to ensure `benchmarkComparison` is fully populated with `industryAverage`, `bestInClass`, and `delta` per competency

### What to Test
- Seed script writes all expected benchmark documents with correct composite IDs
- The analysis route (Step 9) correctly looks up the benchmark for a given team's industry/function/size
- When no benchmark exists, Claude generates and persists a supplementary benchmark
- The supplementary benchmark is used on subsequent analyses without being regenerated
- Admin benchmarks page displays all seeded data correctly
- Editing a benchmark value updates the Firestore document

### Done Criteria
- Benchmark data is seeded for all key industry/function/size combinations
- Analysis correctly includes benchmark comparison in the `insights` document
- AI-supplemented benchmarks are persisted and not repeatedly regenerated
- Admin benchmarks page is functional

---

## Step 11 � Team Manager Dashboard

**Depends on:** Steps 9 and 10

### What to Build
- Manager layout (`app/(manager)/layout.tsx`) with sidebar: Overview, Assessment, Action Plan
- **Overview page** (`/dashboard`): summary card showing team name, engagement status, completion count, overall competency scores at a glance
- **Operational Maturity Assessment page** (`/dashboard/assessment`):
  - Spider/radar chart: three axes for the three competencies, three data series: Aggregated, Manager, Member � built with Recharts `RadarChart`
  - Score cards below the chart: one per competency, showing the aggregated score, the manager score, the member score, and the benchmark delta
  - Benchmark row: displays industry average and best-in-class scores per competency, with a delta indicator (e.g. "+0.4 above industry average")
  - AI summary section: Claude-generated narrative (`insights.aiSummary`)
  - Key strengths section: listed from `insights.keyStrengths`
  - Manager vs Member comparison section: highlights the largest gaps between `managerScores` and `memberScores` per competency with a brief explanation from the AI summary
- Dashboard is only accessible when the engagement `status` is `"analysed"` � show a "Results not yet available" state for earlier statuses
- All data fetched server-side from `insights` and `engagements` documents using the manager's `teamId`

### What to Test
- Dashboard is inaccessible without authentication (redirects to login)
- Manager sees only their own team's data (verify with two manager accounts)
- Spider/radar chart renders with correct data for all three series
- Score cards show correct aggregated, manager, and member scores
- Benchmark delta is displayed correctly (positive and negative)
- AI summary and key strengths render from stored Firestore content
- "Results not yet available" state shows for non-analysed engagements
- Dashboard renders correctly on desktop (primary target) and acceptably on tablet

### Done Criteria
- Team manager can log in and view the full assessment dashboard
- Spider chart renders all three competencies with aggregated, manager, and member series
- Benchmark comparison is displayed per competency
- All content is sourced from Firestore � no AI calls on page load
- Data scoping is enforced: manager sees only their team

---

## Step 12 � Interactive Action Plan

**Depends on:** Step 11 (action plan is part of the manager dashboard)

### What to Build
- **Action Plan page** (`/dashboard/action-plan`):
  - Toggle or tabs: Short-Term | Long-Term (filters by `timeframe` field)
  - Each action displayed as a card containing:
    - Title (bold, prominent)
    - Description (full text)
    - Competency tag (colour-coded chip: one colour per competency)
    - Status badge: "Not Started" (neutral grey), "In Progress" (Amber Gold), "Complete" (Deep Forest green)
    - "Assigned to" text input (free text)
    - Due date picker
    - Status selector (dropdown or button group)
  - Actions sorted by `priority` within each timeframe group
  - Progress summary bar at the top: "X of Y actions complete"
- **Update action API route** (`/api/action-items/[id]`):
  - Accepts `status`, `assignedTo`, `dueDate` fields
  - Validates that the requesting manager owns this action's `teamId`
  - Writes to Firestore and updates `updatedAt`
- Optimistic UI updates: status changes should feel instant, with background Firestore write
- Oaklin admin view of action items: accessible from the engagement detail page (`/admin/engagements/[id]/actions`), read-only list of all actions with current status

### What to Test
- Short-Term and Long-Term tabs/toggle correctly filter actions
- Updating status persists to Firestore and reflects immediately in the UI
- Assigning an owner saves the name to Firestore
- Setting a due date saves the timestamp to Firestore
- Progress summary count updates when status changes
- A manager cannot update action items belonging to another team (verified by API route validation)
- Oaklin admin can view all action items on the engagement detail page

### Done Criteria
- Team manager can view, filter, and interact with the action plan
- All updates persist to Firestore
- Short-term vs long-term actions are clearly distinguished
- Progress tracking is functional
- Oaklin admin read-only view is accessible

---

## Step 13 � Oaklin Portfolio View and Data Export

**Depends on:** Steps 3, 9, 11 (all core data exists)

### What to Build
- **Portfolio overview page** (`/admin/portfolio`):
  - Summary metrics at top: total organisations, total teams, total active engagements, total analysed engagements
  - Table of all engagements across all organisations, columns: Organisation, Team, Function, Industry, Status, Completed Respondents, People & Relationships score, Growth & Impact score, Purpose & Alignment score, Analysed Date
  - Filter by: organisation, industry, function, status
  - Click-through to the engagement detail page for each row
- **Raw data export**:
  - "Export CSV" button on the portfolio page and on individual engagement detail pages
  - CSV export includes: all respondent metadata, all question texts, all individual scores (anonymised � no names for member responses), engagement metadata
  - Export is generated server-side via a route handler (`/api/export/[engagementId]`) and streamed as a file download
  - Full portfolio export available from the portfolio page (all engagements as a single CSV)
- Final Firestore security rules review and tightening:
  - Confirm that no client-side code can read data outside its intended scope
  - Confirm that all writes go through authenticated server routes
  - Test rules using the Firebase Emulator security rules test suite

### What to Test
- Portfolio page displays all engagements across all organisations
- Filters work correctly (by org, industry, function, status)
- Competency scores display correctly for analysed engagements (blank for others)
- Single-engagement CSV export downloads correctly and contains all expected columns
- Full portfolio CSV export downloads all engagements
- Firestore security rules correctly block a team manager from reading another team's data (test with Firebase Emulator)
- Firestore security rules correctly block unauthenticated reads of all admin collections

### Done Criteria
- Oaklin admin portfolio view is complete and functional
- CSV export works for individual engagements and full portfolio
- Firestore security rules are finalised and tested
- The full MVP is end-to-end testable from engagement creation through to action plan management
- Application is deployed to Vercel production from the main GitHub branch

---

## MVP Completion Checklist

At the end of Step 13, verify the following end-to-end user journeys work completely:

### Journey 1 � Full Engagement Lifecycle (Oaklin Admin)
- [ ] Create organisation and team
- [ ] Create engagement, generate tokens
- [ ] Invite team members via email and share the shareable link
- [ ] Activate engagement
- [ ] Close and trigger AI analysis
- [ ] View portfolio with scores and export CSV

### Journey 2 � Survey Completion (Team Member, email invite)
- [ ] Receive invite email, click link
- [ ] Enter name (or use pre-filled), begin survey
- [ ] Answer all questions with score criteria visible
- [ ] Submit and see confirmation screen

### Journey 3 � Survey Completion (Team Member, shared link)
- [ ] Open the shared URL
- [ ] Enter name, begin survey
- [ ] Answer all questions, submit

### Journey 4 � Manager Survey and Dashboard
- [ ] Receive Firebase invite email, set password
- [ ] Complete the manager-variant survey via the manager survey token
- [ ] After analysis, log into the dashboard
- [ ] View spider chart, scores, benchmarks, and AI summary
- [ ] View and interact with the action plan

### Journey 5 � Data Scoping Verification
- [ ] Team Manager A cannot access Team Manager B's dashboard
- [ ] No team member can access any dashboard route
- [ ] Unauthenticated users cannot access admin or dashboard routes
- [ ] CSV export does not include other clients' data
