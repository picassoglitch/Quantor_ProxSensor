# TBM Sensor Dashboard - People Counting SaaS

A modern, real-time people counting dashboard built with Next.js 14, TypeScript, and Supabase. Track device detections, analyze foot traffic, and monitor visitor patterns with beautiful visualizations.

## Features

- 🔴 **Real-time Updates** - Live data via Supabase Realtime subscriptions
- 📊 **Advanced Analytics** - Peak hours, heatmaps, dwell time, unique visitors
- 📍 **Multi-Location Support** - Track multiple sensors across different locations
- 📱 **Mobile Responsive** - Beautiful UI that works on all devices
- 🌙 **Dark Mode** - Toggle between light and dark themes
- ⚡ **Fast Performance** - Server-side data fetching + client-side realtime
- 🎨 **Modern Design** - Professional SaaS look inspired by Placer.ai and Shopify Analytics

## Tech Stack

- **Next.js 14** - App Router with React Server Components
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Database and real-time subscriptions
- **Recharts** - Beautiful, responsive charts
- **Lucide Icons** - Modern icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project with `detections` table
- ESP32-C6 sensors sending data to Supabase

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tbm-sensor-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   
   The Supabase URL and anon key are already configured in `lib/supabase.ts`. If you need to change them:
   ```typescript
   const supabaseUrl = 'https://your-project.supabase.co'
   const supabaseAnonKey = 'your-anon-key'
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The dashboard expects a `detections` table with the following structure:

```sql
CREATE TABLE detections (
  id bigint PRIMARY KEY,
  sensor_id text,
  location text,
  wifi_rssi integer,
  devices jsonb[],  -- Array of: {mac, fp, rssi, peak_rssi, duration, packets, distance_m}
  created_at timestamptz
);
```

## Features Overview

### Live People Count
- Real-time count of devices detected in the last 30 seconds
- Updates automatically via Supabase Realtime
- Visual pulse animation on count changes

### Statistics Cards
- **Unique Visitors Today** - Count of unique MAC addresses today
- **This Week** - Unique visitors in the last 7 days
- **This Month** - Unique visitors in the last 30 days
- **Average Dwell Time** - Average time devices stay in range (in minutes)

### Peak Hour Chart
- Bar chart showing hourly distribution of detections
- Highlights the peak hour with highest activity
- Updates based on selected date range

### Activity Heatmap
- 7-day heatmap showing activity by day and hour
- Color intensity indicates detection volume
- Hover tooltips show exact counts

### Activity Feed
- Live feed of recent device detections
- Shows MAC address, location, distance, and timestamp
- Auto-updates with new detections

## Dashboard Controls

### Location Filter
- Select specific location or view all locations
- Auto-detects all locations from database

### Date Range
- **Today** - Current day's data
- **Yesterday** - Previous day's data
- **7 Days** - Last 7 days
- **30 Days** - Last 30 days

### Dark Mode
- Toggle between light and dark themes
- Preference persists across sessions

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Next.js
4. Deploy!

The dashboard will work out of the box with your Supabase project.

### Other Platforms

The dashboard can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Performance

- **Server-side data fetching** for initial load
- **Real-time subscriptions** for live updates
- **Optimized queries** with proper indexing
- **Lazy loading** for charts and components
- **Responsive images** and assets

## Security

- Uses Supabase Row Level Security (RLS)
- Public anon key for read-only access
- No sensitive data exposed
- CORS configured via Supabase

## Customization

### Styling
- Modify `tailwind.config.ts` for theme colors
- Update `app/globals.css` for global styles
- Components use Tailwind utility classes

### Charts
- Recharts components in `components/PeakHourChart.tsx` and `components/HeatmapChart.tsx`
- Customize colors, labels, and tooltips

### Data Processing
- Modify `calculateStats()` in `app/page.tsx` for custom metrics
- Add new API routes in `app/api/` for server-side processing

## Troubleshooting

### No data showing
- Check Supabase connection in `lib/supabase.ts`
- Verify `detections` table exists and has data
- Check browser console for errors

### Real-time not working
- Ensure Supabase Realtime is enabled for the `detections` table
- Check network tab for WebSocket connections
- Verify RLS policies allow read access

### Charts not rendering
- Check that Recharts is installed: `npm install recharts`
- Verify data format matches expected structure
- Check browser console for errors

## License

ISC

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check Next.js documentation

---

Built with ❤️ for modern people counting analytics
