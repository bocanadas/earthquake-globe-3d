# Global Earthquake Monitor

A 3D interactive globe that shows 24 hour frame real-time earthquake data from around the world. Built with Three.js and the USGS Earthquake API.

## Live Demo

https://earthquake-globe-3d.vercel.app

## What It Does

This project visualizes earthquakes from the past 24 hours on an interactive 3D globe. You can click on earthquakes to see details like magnitude, location, time, and depth. The globe rotates automatically but pauses when you select an earthquake so you can inspect it.

## How the API Works

The project uses the **USGS Earthquake API** to get live earthquake data for the past 24 hours.

**API Details:**
- Endpoint: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`
- Method: Standard HTTP GET request using JavaScript's built-in `fetch()` function
- Parameters: None needed - the endpoint automatically returns all earthquakes from the last 24 hours
- Response Format: GeoJSON (basically JSON with geographic coordinates)

**What the API returns:**
- An array of earthquake objects with these properties:
  - `geometry.coordinates` - [longitude, latitude, depth in km]
  - `properties.mag` - Magnitude (strength of earthquake)
  - `properties.place` - Text description of where it happened
  - `properties.time` - When it happened (Unix timestamp)
  - `properties.url` - Link to the full USGS page with more details
  - And other stuff I didn't end up using

**Technologies:**
- Three.js for the 3D rendering and camera controls
- Vite as the build tool
- Vanilla JavaScript for everything else

## Running Locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Features

- Interactive 3D globe you can rotate with your mouse
- Real-time earthquake data (updates every time you refresh)
- Color-coded markers (green = minor, yellow = light, orange = strong, red = major)
- Click earthquakes to see detailed info
- Globe rotation pauses when viewing details
- Intro screen with instructions
- Legend showing what the colors mean

## No API Key Needed

The USGS API is completely free and public - no authentication, no rate limits to worry about, no keys to hide. Just make the request and it works.
