# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify Supabase Configuration
The Supabase URL and anon key are already configured in `lib/supabase.ts`:
- URL: `https://zproheefniynfxbsvuku.supabase.co`
- Anon Key: `d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_`

### Step 3: Enable Realtime in Supabase
1. Go to your Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for the `detections` table
4. This enables real-time updates in the dashboard

### Step 4: Run Development Server
```bash
npm run dev
```

### Step 5: Open Dashboard
Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 What You'll See

- **Live People Count** - Real-time count of devices in the last 30 seconds
- **Statistics Cards** - Unique visitors, dwell time, and more
- **Peak Hour Chart** - Hourly distribution of detections
- **Activity Heatmap** - 7-day heatmap by hour
- **Live Activity Feed** - Recent device detections

## 🎨 Features

✅ Real-time updates via Supabase Realtime  
✅ Multi-location support  
✅ Date range filtering  
✅ Dark mode toggle  
✅ Mobile responsive  
✅ Beautiful charts and visualizations  

## 🚢 Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Deploy!

That's it! Your dashboard is live.

## 🔧 Troubleshooting

**No data showing?**
- Check that your ESP32 sensors are sending data to Supabase
- Verify the `detections` table has records
- Check browser console for errors

**Real-time not working?**
- Ensure Realtime is enabled in Supabase Dashboard
- Check Network tab for WebSocket connections

**Charts not rendering?**
- Verify Recharts is installed: `npm install recharts`
- Check browser console for errors

## 📝 Next Steps

- Customize colors in `tailwind.config.ts`
- Add authentication (see Supabase Auth docs)
- Add more analytics and metrics
- Set up alerts and notifications

Enjoy your people counting dashboard! 🎉

