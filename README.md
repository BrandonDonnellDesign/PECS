<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PECS Creator - Communication Board Builder

A modern, accessible PECS (Picture Exchange Communication System) board creator with cloud sync, family sharing, and real-time collaboration.

## Features

- 🎨 **Visual Board Builder**: Create custom communication boards with drag-and-drop
- 👨‍👩‍👧‍👦 **Family Groups**: Share boards with family members and collaborate
- 🔊 **Text-to-Speech**: Click cards to hear labels spoken aloud
- 😊 **Emoji Support**: Quick card creation with built-in emoji picker
- 📥 **Export/Import**: Backup and share boards as JSON files
- ⏪ **Undo/Redo**: Full history tracking with keyboard shortcuts
- 🖨️ **Print Optimized**: Print-ready layouts for physical cards
- 🌙 **Dark Mode**: Easy on the eyes
- 📱 **PWA Support**: Install as a mobile app
- 🔐 **Google Sign-In**: Quick authentication with Google OAuth

## Quick Start

### Prerequisites
- Node.js 16+
- A Supabase account (for cloud features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pecs-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database**
   ```bash
   npx supabase db reset
   ```

5. **Run the app**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Google OAuth Setup

To enable Google Sign-In, follow the detailed guide in [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md).

Quick steps:
1. Create OAuth credentials in Google Cloud Console
2. Add credentials to Supabase Auth settings
3. Configure redirect URLs
4. Test the integration

## Database Setup

The app uses Supabase for authentication and data storage. Run the migrations:

```bash
npx supabase db reset
```

Or manually apply migrations in the Supabase dashboard.

See [FIX_RLS_GUIDE.md](FIX_RLS_GUIDE.md) for RLS configuration details.

## New Features

Check [NEW_FEATURES.md](NEW_FEATURES.md) for the latest features including:
- Undo/Redo functionality
- Export/Import boards
- Text-to-Speech with natural voices
- Emoji picker
- Improved print layouts

## Documentation

- [Google OAuth Setup](GOOGLE_AUTH_SETUP.md) - Configure Google Sign-In
- [RLS Fix Guide](FIX_RLS_GUIDE.md) - Database security setup
- [New Features](NEW_FEATURES.md) - Latest feature documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Supabase locally
npx supabase start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Open an issue on GitHub
- Review documentation files

---

Built with ❤️ for accessible communication
