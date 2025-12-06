# SheetSense

A full-stack Next.js 16 application for analyzing Google Sheet data with AI-powered insights.


https://github.com/user-attachments/assets/3f49a40b-caf4-423f-a121-27478ea47742


## Features

- Upload CSV/XLSX files for analysis
- Automatic column type detection (numeric, text, date)
- Sentiment analysis for text columns
- Statistical summaries for numeric columns
- Beautiful glassmorphism UI design
- Dark/Light mode support
- MongoDB integration for storing analyses

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Shadcn/UI
- **Database**: MongoDB (Mongoose)
- **Charts**: Chart.js (react-chartjs-2)
- **File Processing**: xlsx, csv-parse

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api
    /upload          # File upload endpoint
    /analyses        # Analyses list endpoint
    /analyses/[id]   # Single analysis endpoint
  /dashboard         # Main dashboard page
  /analyses          # Analyses list page
  /analyses/[id]     # Analysis detail page
  /settings          # Settings page
  /reports           # Reports placeholder page
/components
  /ui                # Shadcn/UI components
  Sidebar.tsx        # Navigation sidebar
  FileUpload.tsx     # File upload component
/lib
  db.ts              # MongoDB connection
  sheet.ts           # Sheet processing utilities
  utils.ts           # Utility functions
/models
  Analysis.ts        # MongoDB Analysis model
```

## API Routes

### POST /api/upload
Upload a CSV or XLSX file for analysis.

**Request**: FormData with `file` field
**Response**: Analysis object with ID, fileName, rowCount, columns, createdAt

### GET /api/analyses
Get list of all analyses.

**Response**: Array of analysis objects (fileName, rowCount, createdAt)

### GET /api/analyses/[id]
Get a single analysis by ID.

**Response**: Full analysis object with all column metadata

## License

MIT

