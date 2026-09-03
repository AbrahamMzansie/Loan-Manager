# Loan Manager

A small system for tracking money you lend out, the interest owed, who has
paid, and who is overdue. Built with React (Vite, installable as a PWA) and
a Node/Express API backed by PostgreSQL.

## What it does

- Stores customer details (name, phone, email, ID number, address, notes).
- Records loans against a customer: principal amount, interest rate, and
  the repayment period.
- Automatically calculates the balance owed, including interest, and marks
  a loan **Paid** once enough payments have been recorded against it.
- Flags a loan **Overdue** once its due date passes without full payment,
  and generates a printable overdue invoice/statement per loan.
- Installable on a phone or desktop as a PWA, and keeps working (viewing
  recently-loaded data, and queuing new customers/loans/payments) when
  your connection drops — see "Offline support" below.

## How the interest is calculated

You described: borrow R1000, pay back R1300 within the month (30%
interest). If it's still unpaid after a month, another 30% is added to
the *outstanding* amount for every extra month it stays unpaid — not a
flat re-charge of the original R1000. That's implemented in
`server/src/utils/interest.js`:

```
periodsElapsed = floor(daysSinceLoanStarted / periodDays) + 1
totalDue       = principal * (1 + interestRate) ^ periodsElapsed
balance        = totalDue - totalPaid
```

Example with the default 30% / 30-day settings, principal R1000:

| Time since loan started | Periods elapsed | Total due |
|---|---|---|
| Day 0–29 (within first period) | 1 | R1,300.00 |
| Day 30–59 (1 month overdue)    | 2 | R1,690.00 |
| Day 60–89 (2 months overdue)   | 3 | R2,197.00 |

The interest rate (default 30%) and period length (default 30 days) are
both editable in **Settings**, and can also be overridden per individual
loan when you create it (e.g. if one customer negotiated a different rate).

If you'd rather interest **not** compound — i.e. it stays at a flat 30% no
matter how overdue a loan gets — that's a one-line change in
`computeLoanBalance` (multiply by `(1 + rate * periodsElapsed)` instead of
`(1 + rate) ** periodsElapsed`). Ask and it can be swapped.

## Project structure

```
loan-manager/
  server/     Node/Express API + Prisma (PostgreSQL)
  client/     React + Vite PWA frontend
  docker-compose.yml   Local PostgreSQL for development
```

## Getting it running locally

Requirements: Node.js 18+, npm, and Docker (for the local database — or
point `DATABASE_URL` at any PostgreSQL instance you already have).

1. **Start PostgreSQL:**
   ```
   docker compose up -d
   ```

2. **Set up the API server:**
   ```
   cd server
   cp .env.example .env
   npm install
   npx prisma migrate dev --name init
   npm run seed        # creates a default admin login, prints it to the console
   npm run dev          # starts the API on http://localhost:4000
   ```
   The seed script creates `admin@example.com` / `changeme123` unless you
   set `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars first. Change the password
   after your first login (there's no in-app "change password" screen yet —
   easiest is to re-run the seed with a new password after deleting the old
   user row, or add one; ask if you want that screen built).

3. **Set up the frontend:**
   ```
   cd client
   cp .env.example .env
   npm install
   npm run dev          # starts the app on http://localhost:5173
   ```

4. Open http://localhost:5173, log in, and start adding customers and loans.

Alternatively, skip step 2's seed script and use the **"Create the admin
account"** link on the login screen — it works once, while
`ALLOW_FIRST_ADMIN_SETUP=true` in `server/.env` (the default). Turn it off
in production once you've made your account.

## Deploying it for real use (multi-device / staff access)

Since you want staff to log in and use this as a real web app (and
installable PWA), you'll want to host it rather than just run it on one
laptop. A simple, low-cost path:

- **Database:** a managed PostgreSQL instance — Railway, Render, Neon, or
  Supabase all have free/cheap tiers that work fine for this.
- **API server:** deploy the `server/` folder to Render, Railway, or Fly.io.
  Set the environment variables from `.env.example` (in particular
  `DATABASE_URL` pointing at your managed Postgres, a strong `JWT_SECRET`,
  and `CORS_ORIGIN` set to your frontend's URL). Run
  `npx prisma migrate deploy` once against the production database, then
  `npm run seed` (with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set) to create your
  first login.
- **Frontend:** deploy the `client/` folder to Vercel or Netlify (both
  build static PWAs well). Set `VITE_API_URL` to your deployed API's URL
  (e.g. `https://your-api.onrender.com/api`).

Once both are deployed over HTTPS, staff can open the site on their phone
and use "Add to Home Screen" to install it like an app.

## Offline support (PWA)

- The app shell (HTML/CSS/JS) and recently-viewed API data (dashboard,
  customer list, loan list) are cached by a service worker, so opening the
  installed app with no signal still shows the last data you loaded.
- Adding a customer, creating a loan, or recording a payment while offline
  is queued in the browser's local IndexedDB storage and sent to the
  server automatically the moment the device is back online (checked on
  reconnect and whenever the app regains focus). You'll see a small
  "N pending sync" badge in the header while changes are queued.
- What this does **not** do: full offline editing of *existing* records
  with conflict resolution, or offline access to data you've never opened
  before on that device. For a small team doing occasional field visits,
  this covers the realistic case (view recent data, record new
  loans/payments) without the complexity of a full sync engine.

## Roles

- **Admin**: everything staff can do, plus editing interest-rate/period
  defaults and creating staff logins (Settings page).
- **Staff**: manage customers, loans, and payments.

## Notes on the interest rule and legal compliance

Interest rates and disclosure requirements on informal lending are
regulated in most places (e.g. South Africa's National Credit Act sets
rules on registration and maximum interest for credit providers). This
build implements the calculation you described exactly as specified, but
it's worth checking with someone knowledgeable about local lending
regulations to make sure the rate and terms you're charging are compliant
for your situation — this is a bookkeeping tool, not legal advice.
