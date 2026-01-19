# LotWorks Website Market Report v2

A comprehensive analytics dashboard for LotWorks public maps, showing buyer engagement metrics, community performance, device analytics, and lot interest rankings.

## Features

### Summary Metrics
- **Map Loads** - Total page views on map pages
- **Lot Clicks** - Total clicks on lot info windows
- **Avg. Time on Map** - Average session duration
- **Click Rate** - Lot clicks as percentage of map loads

### Analytics Sections
- **AI Insights** - Auto-generated actionable insights
- **Map Load Trend** - Daily views over time
- **Lot Clicks by Day of Week** - Engagement patterns
- **Device Category** - Mobile vs Desktop vs Tablet
- **Top Countries** - Geographic distribution
- **Browser & OS Breakdown** - Technical demographics
- **Top Traffic Sources** - Referral analysis
- **Community Performance** - Sortable, paginated table with heatmaps
- **Lot Click Ranking** - Top performing lots

### Interactive Features
- **Client Selector** - Switch between organizations
- **Date Range Picker** - Preset and custom date ranges
- **Export to CSV** - Download full report data
- **Refresh** - Real-time data updates
- **Pagination** - Navigate large datasets
- **Sortable Columns** - Click to sort tables

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Analytics**: Google Analytics 4 Data API
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/lotworks-market-report.git
cd lotworks-market-report
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```env
GA4_PROPERTY_ID=388261311
GOOGLE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-json>
```

To generate the base64 string:
```bash
base64 -i your-service-account.json | tr -d '\n'
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `GA4_PROPERTY_ID`
   - `GOOGLE_SERVICE_ACCOUNT_BASE64`
4. Deploy

## Project Structure

```
lotworks-market-report/
├── app/
│   ├── api/
│   │   ├── clients/route.ts    # GET /api/clients
│   │   └── report/[client]/route.ts  # GET /api/report/:client
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main dashboard
├── lib/
│   └── ga4.ts                  # GA4 API client
├── types/
│   └── index.ts                # TypeScript definitions
└── ...config files
```

## API Endpoints

### GET /api/clients
Returns available client organizations.

### GET /api/report/:client
Returns full market report.

**Query Parameters:**
- `start_date` (YYYY-MM-DD, default: 30 days ago)
- `end_date` (YYYY-MM-DD, default: today)

## GA4 Custom Dimensions Required

| Dimension | Parameter |
|-----------|-----------|
| Client | `c_client` |
| Community | `c_community` |
| Lot | `c_lot` |
| URL Path | `c_urlpath` |
| Category | `c_category` |

## License

Proprietary - LotWorks/Blueprint Software
