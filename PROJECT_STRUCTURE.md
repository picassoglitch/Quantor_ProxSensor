# Project Structure

```
tbm-sensor-dashboard/
├── app/
│   ├── globals.css          # Global styles with Tailwind and dark mode
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main dashboard page with real-time logic
├── components/
│   ├── DashboardHeader.tsx  # Header with filters and dark mode toggle
│   ├── StatCard.tsx         # Reusable statistics card component
│   ├── LiveCountCard.tsx    # Prominent live people count card
│   ├── PeakHourChart.tsx    # Bar chart showing hourly distribution
│   ├── HeatmapChart.tsx     # 7-day activity heatmap
│   └── ActivityFeed.tsx    # Live feed of recent detections
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   ├── types.ts             # TypeScript type definitions
│   └── utils.ts             # Utility functions (formatting, etc.)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── next.config.js           # Next.js configuration
├── vercel.json              # Vercel deployment configuration
└── README.md                # Full documentation

```

## Key Files Explained

### `app/page.tsx`
- Main dashboard component
- Handles real-time subscriptions
- Calculates statistics
- Manages state and data fetching

### `lib/supabase.ts`
- Supabase client initialization
- Database type definitions
- Configured with your project URL and anon key

### `components/`
- Modular, reusable components
- Each component handles its own data fetching
- Responsive and accessible

## Data Flow

1. **ESP32 Sensors** → Send data to Supabase `detections` table
2. **Supabase Realtime** → Broadcasts new detections via WebSocket
3. **Dashboard** → Subscribes to real-time changes
4. **Components** → Update automatically when new data arrives

## Customization Points

- **Colors**: `tailwind.config.ts` and `app/globals.css`
- **Statistics**: `calculateStats()` function in `app/page.tsx`
- **Charts**: Components in `components/` directory
- **Layout**: `app/page.tsx` and component structure

