# LotWorks Website Market Report

A modern analytics dashboard for LotWorks public maps, showing buyer engagement metrics, community performance, and lot interest rankings.

![Dashboard Preview](./preview.png)

## Features

- **Summary Metrics**: Total map loads, lot clicks, click-through rate
- **AI Insights**: Auto-generated insights highlighting trends and opportunities
- **Community Performance**: Compare engagement across all communities
- **Lot Click Rankings**: See which lots are getting the most attention
- **Time Series Charts**: Visualize engagement trends over time

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

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your GA4 credentials:

```env
GA4_PROPERTY_ID=388261311
GA4_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key must include the `\n` characters for line breaks.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

If GA4 credentials are not configured, the app will show mock data.

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lotworks-market-report.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure environment variables:
   - `GA4_PROPERTY_ID`
   - `GA4_CLIENT_EMAIL`
   - `GA4_PRIVATE_KEY`
4. Click **Deploy**

### Environment Variables in Vercel

When adding `GA4_PRIVATE_KEY` in Vercel:
1. Go to your project settings → Environment Variables
2. Add the key name: `GA4_PRIVATE_KEY`
3. Paste the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
4. Vercel will handle the formatting automatically

## Project Structure

```
lotworks-market-report/
├── app/
│   ├── api/
│   │   ├── clients/
│   │   │   └── route.ts        # GET /api/clients
│   │   └── report/
│   │       └── [client]/
│   │           └── route.ts    # GET /api/report/:client
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main dashboard page
├── components/
│   ├── charts/
│   │   └── index.tsx           # Recharts components
│   └── dashboard/
│       ├── CommunityRow.tsx
│       ├── InsightCard.tsx
│       ├── StatCard.tsx
│       └── TopLotRow.tsx
├── lib/
│   ├── ga4.ts                  # GA4 API client
│   └── mock-data.ts            # Mock data for development
├── types/
│   └── index.ts                # TypeScript types
└── ...config files
```

## API Endpoints

### GET /api/clients

Returns a list of all available client organizations.

```json
{
  "clients": ["Coastal Bend Lots", "Sunrise Communities", ...]
}
```

### GET /api/report/:client

Returns the full market report for a specific client.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format (default: 28 days ago)
- `end_date` (optional): End date in YYYY-MM-DD format (default: today)

**Example:**
```
GET /api/report/Coastal%20Bend%20Lots?start_date=2025-12-01&end_date=2025-12-31
```

## GA4 Custom Dimensions

This dashboard expects the following custom dimensions in your GA4 property:

| Dimension Name | Scope | Description |
|----------------|-------|-------------|
| `Client` | Event | Organization/client identifier |
| `Community` | Event | Community/neighborhood name |
| `Lot` | Event | Individual lot identifier |

And the following event:

| Event Name | Description |
|------------|-------------|
| `maps-openInfoWin` | Fired when a user clicks on a lot |

## Future Enhancements

- [ ] Firebase Authentication integration
- [ ] Multi-client selector
- [ ] Date range picker
- [ ] PDF/CSV export
- [ ] Real-time updates
- [ ] Geographic heatmaps

## License

Proprietary - LotWorks/Blueprint Software
