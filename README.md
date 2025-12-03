# Web Analytics

A lightweight, self-hosted web analytics platform: add one script tag to any website, collect page views, and view multi-site insights in a dashboard. Built with Next.js (App Router) + Supabase.

> Goal: simple, hackable, OSS-friendly analytics you can run on your own domain.

---

## What this repository contains (simple explanation)

This **one Next.js project** does three things:

1) **Serves the tracking script**
- URL: `https://YOUR-ANALYTICS-DOMAIN/track.js`
- You paste this into other websites using a `<script>` tag.

2) **Receives pageview events**
- URL: `https://YOUR-ANALYTICS-DOMAIN/api/track`
- The tracking script sends pageview data here.

3) **Shows a dashboard**
- URL: `https://YOUR-ANALYTICS-DOMAIN/dashboard`
- Displays analytics for one site or all sites.

---

## Key files you’ll work with

If you are using Next.js App Router, these are the important files:

- Tracking script (the JS file served to the public):
  - `app/track.js/route.ts`

- Tracking API endpoint (receives POST requests and inserts into Supabase):
  - `app/api/track/route.ts`

- Sites API endpoint (lists sites shown in the dashboard selector):
  - `app/api/sites/route.ts`

- Analytics API endpoint (aggregates analytics for dashboard):
  - `app/api/analytics/route.ts`

- Dashboard UI page:
  - `app/dashboard/page.tsx`

---

## Requirements

- Node.js 18+
- A Supabase project (Postgres)

---

## Setup

### 1) Install

```bash
git clone <your-repo-url>
cd web-analytics
npm install
