# Orbit � Project Brief

---

## 1. Problem Statement

Organisations struggle to diagnose team performance issues in a consistent, objective way. Challenges are typically surfaced through anecdotal feedback or isolated observations, with no structured view across roles and no clear path to resolution. Without a repeatable framework, leadership teams cannot confidently compare performance over time, prioritise interventions, or validate whether efforts are having impact.

Orbit solves this by providing a structured diagnostic platform grounded in operational maturity frameworks. It captures perspectives from both team managers and team members, compares those perspectives for misalignment, and uses AI to synthesise responses into prioritised, data-backed actions. Orbit is operated by Oaklin on behalf of client organisations and is particularly valuable during periods of high turnover, team restructuring, system implementations, or any transition where alignment and performance clarity are critical.

---

## 2. Target Users

Orbit has three distinct roles with different access levels and needs.

### Oaklin Admin
Internal Oaklin staff who administer the platform. They create client organisations, teams, and survey engagements. They have full read/write access across all client data and can export raw response data. They are the only users with access to the back-office admin portal, this will include the ability to manage the benchmarking data that will be included as an example.

### Team Manager
A client-side manager responsible for a specific team. They complete the manager-variant of the survey, then access a password-protected dashboard once the engagement is closed and analysed. Their view is scoped to their own team only � they cannot see other teams, even within the same organisation. They interact with the action plan to track progress.

### Team Member
A member of the client team. They access the survey via a shared link or an individual email invitation and complete the member-variant of the survey. They have no login, no dashboard access, and no visibility into aggregated results.

---

## 3. Core User Journey

```
Oaklin Admin                Team Manager                 Team Member
??????????????????????????????????????????????????????????????????????
1. Creates organisation,
   team, and engagement
   in admin portal
   ?
2. System generates:
   - shared member link
   - individual invite tokens
   - manager Firebase invite
   ?
3. Admin activates
   engagement (status: active)
                              4. Manager receives
                                 Firebase email invite,
                                 sets password, accesses
                                 dashboard (locked state)
                                 ?
                              5. Manager completes
                                 manager-variant survey
                                              ?
                                             6. Members receive
                                                shared link or
                                                individual email
                                                ?
                                             7. Members complete
                                                member-variant survey
                                                (no login required)
8. Admin monitors
   completion status,
   closes engagement
   when ready
   ?
9. Claude analyses all
   responses: scores per
   competency, manager vs
   member comparison,
   benchmark deltas,
   AI summary, actions
   ?
10. Insights + action plan
    written to Firestore. Admin is able to export raw data to a csv file. 
                              11. Manager dashboard
                                  unlocks: spider diagram,
                                  AI summary, benchmark
                                  comparison, action plan
                                  ?
                              12. Manager tracks actions:
                                  assigns owners, sets
                                  due dates, marks progress
```

---

## 4. MVP Feature List

### Feature 1 � Branded Survey Link with No-Login Client Access
Team members access the survey via a URL containing a unique token. No account creation or login required. The token identifies the engagement and the respondent's role (member). A separate token is used for manager survey access. The survey is branded to Orbit/Oaklin visual standards.

### Feature 2 � Survey Completion and AI Analysis
A fixed, Oaklin-authored question bank structured around three core competencies. Questions are role-specific (manager variant / member variant / shared). Each question is scored on a 1�5 scale with defined criteria per score level. Upon engagement closure, Claude processes all responses and generates: competency scores (aggregated and by role), AI narrative summary, quick wins, strategic initiatives, and benchmark comparison deltas. AI is used for analysis and action generation only � not question generation.

### Feature 3 � Portfolio Dashboard (Oaklin and Team Manager Access)
Team managers see a dashboard scoped to their own team. Oaklin admins see a cross-organisation portfolio view. The dashboard is authentication-gated (Firebase email/password). Displays competency scores, engagement status, and links to detailed assessment views.

### Feature 4 � Operational Maturity Assessment View
Spider/radar chart visualising scores across the three competencies: People & Relationships, Growth & Impact, and Purpose & Alignment. Displays aggregated scores alongside individual role breakdowns (manager vs member). Each competency score is shown with context from benchmark data.

### Feature 5 � Team Manager / Team Member Analysis
Side-by-side or overlay comparison of manager responses versus member responses per competency. Highlights areas of misalignment. AI surfaces the most significant gaps and contextualises what they indicate about team dynamics.

### Feature 6 � Industry Benchmarking
Benchmarks are seeded into Firestore as static figures per industry, office function (back / middle / front), and team size range, authored by Oaklin. Where benchmark data gaps exist, Claude generates plausible supplementary figures. Each competency score on the dashboard is shown alongside a best-in-class figure and an industry average, with a delta indicator.

### Feature 7 � Action Plan
AI generates a prioritised list of actions split into short-term tactical wins and longer-term strategic initiatives, written to Firestore when the engagement is analysed. The team manager can interact with each action: update status (not started / in progress / complete), assign an owner by name, and set a due date. Oaklin admins can view all action plans across engagements.

---

## 5. UI Specification

### Colour Palette

| Role       | Name        | Hex       | Usage                                          |
|------------|-------------|-----------|------------------------------------------------|
| Primary    | Deep Forest | `#1A4D23` | Nav, headings, primary buttons, key labels     |
| Secondary  | Mid Green   | `#2E7D3A` | Hover states, secondary buttons, chart fills   |
| Accent     | Amber Gold  | `#F5A623` | Callouts, highlights, short-term action labels |
| Background | Off White   | `#F7F7F7` | Page backgrounds, card backgrounds             |
| Text       | Near Black  | `#1A2E1C` | All body copy and UI labels                    |

Colour is used consistently to signal meaning. Amber Gold is reserved for callouts and short-term actions. Deep Forest anchors the interface. No gradients or decorative textures.

### Typography

- **Headings**: Arial Bold � all headings, section titles, key callouts, metric values
- **Body**: Arial Regular � body copy, descriptions, tooltips, supporting text
- Arial is a system font; no external font imports required

### Layout Principles

- Clean, data-forward layouts with intentional white space
- One primary insight per visual unit � never overload a card or chart
- All findings presented in context (scores alongside benchmarks, never in isolation)
- Short-term and long-term actions always clearly labelled � never grouped in a flat list
- Mobile-responsive but optimised for desktop use (dashboard views are data-dense)

### Key Screen Types

**Survey Screen**
- Full-screen, minimal chrome, progress bar at top
- One question displayed at a time or paginated by competency section
- Score selector with visible criteria descriptions per score level (1�5)
- Orbit logo top-left, no navigation links
- Completion confirmation screen with Oaklin contact prompt

**Dashboard / Assessment Screen**
- Sidebar navigation (Oaklin green, white labels)
- Main content area with card-based layout
- Spider/radar chart centred prominently on the assessment view
- Score cards for each competency below the chart
- Benchmark delta displayed as a labelled indicator (e.g. "+0.4 above industry average")

**Action Plan Screen**
- Tabbed or toggle-filtered view: Short-Term | Long-Term
- Each action displayed as a card with: title, description, status badge, owner field, due date picker
- Status uses colour coding: not started (neutral), in progress (Amber Gold), complete (Deep Forest)

---

## 6. Technical Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Framework          | Next.js 14 (App Router)                         |
| Styling            | Tailwind CSS                                    |
| Database           | Firebase Firestore                              |
| Authentication     | Firebase Authentication (email/password)        |
| Hosting            | Vercel (deployed via GitHub)                    |
| AI                 | Anthropic Claude (via `@anthropic-ai/sdk`)      |
| Email delivery     | To be confirmed � Firebase Extensions or a lightweight transactional email provider (e.g. Resend) |
| Charts             | Recharts or a similar React-compatible charting library (spider/radar chart required) |

All AI calls are server-side only (Next.js Route Handlers or Server Actions). The Anthropic API key is never exposed to the client.

### Firebase region and data location

The production Firebase project (**`orbit-oaklin`**) is provisioned with **Cloud Firestore in London**. In Google Cloud terms the region is **`europe-west2`**. The Firestore location is chosen when the database is first created and is used automatically by the Firebase client SDK and Admin SDK; application code does not pass a region for normal reads and writes.

**Vercel:** The app is hosted on Vercel, which uses a configurable region for Serverless Functions. To keep latency low to Firestore and to align compute with the UK-based database, set the Vercel deployment region to a **European** option where available (for example **London (`lhr1`)** or **Frankfurt (`fra1`)**), and use the same choice consistently across preview and production.

---

## 7. Constraints

### Data Scoping
- Each team manager sees only the teams and engagements assigned to them � enforced at both the Firestore security rules level and the application layer.
- Oaklin admins have full read/write access across all organisations and teams.
- No client can access or view another client's data under any circumstances.

### Team Member Access
- Team members have no login, no dashboard, and no access to aggregated results.
- Member survey responses are stored but never surfaced individually to the manager � only as aggregated competency scores.

### Survey Access Model
- The member survey is accessible via a token in the URL. No account creation is required.
- Shared link tokens are valid for all members of a given engagement. Individual email invite tokens track completion per named respondent.
- Manager survey access uses a separate token flow independent of the dashboard login.

### Admin Portal Access
- The Oaklin back-office admin portal is restricted to authenticated users with the `oaklin_admin` role.
- No client-side user (team manager or team member) can access admin routes.

### AI Usage
- Claude is invoked server-side only, triggered by an explicit engagement closure action by an Oaklin admin.
- AI is not used for question generation. Questions are authored by Oaklin and stored in Firestore.
- AI-generated content is stored in Firestore after generation and served from there � not re-generated on each page load.

### Benchmark Data
- Benchmark data is seeded by Oaklin into Firestore. Where gaps exist (rare industry/function combinations), Claude generates supplementary figures at analysis time, which are also persisted to Firestore.

### No Post-MVP Features in MVP Build
- Insights Discovery profiles, interactive time analysis, case studies, video content, and KPI tracking modules are explicitly out of scope for the MVP build.
