# PECS Creator - Communication Board Builder

A modern, accessible PECS (Picture Exchange Communication System) board creator with cloud sync, family sharing, and real-time collaboration.

## Features

- 🎨 **Visual Board Builder** - Create custom communication boards with drag-and-drop
- 👨‍👩‍👧‍👦 **Family Groups** - Share boards with family using simple invite codes
- 🔊 **Text-to-Speech** - Natural voices with smart selection
- 😊 **Emoji Support** - 500+ emojis in 10+ categories
- 📥 **Export/Import** - Backup and share boards as JSON
- ⏪ **Undo/Redo** - Full history with Ctrl+Z/Y
- 🖨️ **Print Optimized** - Perfect layouts for physical cards
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **PWA Support** - Install as mobile app
- 🔐 **Google Sign-In** - Quick OAuth authentication
- 📊 **Analytics** - Track usage and patterns
- 🎨 **7 Themes** - Beautiful color schemes
- ⌨️ **Keyboard Shortcuts** - Press `?` to see all shortcuts

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd pecs-creator
npm install
```

### 2. Set Up Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply Database Migrations

**⚠️ IMPORTANT:** You must apply migrations before the app will work!

**Option A: Using Supabase CLI**
```bash
supabase db push
```

**Option B: Manual in Supabase Dashboard**
1. Go to your Supabase project → SQL Editor
2. Run each migration file in order from `supabase/migrations/`:
   - `20241130000001_add_family_groups.sql`
   - `20241130000002_family_groups_camelcase.sql`
   - `20241130000003_ensure_profiles.sql`
   - `20241130000007_enable_realtime.sql`
   - `20241130000011_add_helper_functions.sql`
   - `20241202000001_add_invite_system.sql`
   - `20241202000002_enable_rls_with_invite_system.sql`

### 4. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Common Errors & Fixes

### Error: "Error generating invite code"
**Cause:** Migrations not applied yet  
**Fix:** Apply migrations (see step 3 above)

### Error: "infinite recursion detected in policy"
**Cause:** Old RLS policies from previous setup  
**Fix:** Apply the latest migrations - they disable RLS on `family_members` to prevent recursion

### Why is RLS disabled on family_members?
RLS policies on `family_members` cause infinite recursion because they need to check `family_members` to verify membership, which triggers the policy again.

**Solution:** We use `SECURITY DEFINER` functions that:
- Bypass RLS (no recursion)
- Have built-in permission checks
- Control all access to family_members
- Are more secure than RLS policies

This is the recommended PostgreSQL approach for this scenario.

## Using the App

### Create Your First Board
1. Sign up or sign in
2. Click "New Board"
3. Add cards with emojis or images
4. Click cards to hear them speak

### Share with Family
1. Go to "Family Groups" tab
2. Click "Create Group"
3. Click "Generate Invite Code"
4. Share the 6-character code (e.g., "ABC123")
5. Family member clicks "Join Group" and enters code
6. Create boards in the group - everyone can edit!

### Keyboard Shortcuts
- `?` - Show all shortcuts
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+S` - Save
- `Ctrl+P` - Print
- `Esc` - Close modal

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
7. Copy Client ID and Client Secret
8. In Supabase Dashboard → Authentication → Providers:
   - Enable Google
   - Add Client ID and Client Secret
   - Save

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Update Redirect URLs
After deployment, update redirect URLs in:
1. **Supabase Dashboard** → Authentication → URL Configuration
   - Add your production URL
2. **Google Cloud Console** (if using Google OAuth)
   - Add production URL to authorized origins and redirects

## Tech Stack

- **Framework:** Next.js 16 with Turbopack
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with Google OAuth
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel

## Project Structure

```
pecs-creator/
├── app/
│   ├── components/        # React components
│   │   ├── Board.tsx     # Main board component
│   │   ├── FamilyGroups.tsx  # Family sharing
│   │   ├── InviteCodeModal.tsx
│   │   ├── JoinGroupModal.tsx
│   │   └── ...
│   ├── services/
│   │   └── supabase.ts   # Database service
│   ├── page.tsx          # Main app page
│   ├── layout.tsx        # App layout
│   └── globals.css       # Global styles
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static files
└── README.md            # This file
```

## Database Schema

### Tables
- `profiles` - User profiles
- `boards` - PECS boards
- `family_groups` - Family groups for sharing
- `family_members` - Group membership (RLS disabled)
- `family_group_invites` - Invite codes (RLS enabled)

### Key Functions
- `create_family_group_with_owner()` - Create group with owner
- `generate_invite_code()` - Generate 6-char invite code
- `join_group_with_code()` - Join group with code
- `remove_family_member()` - Remove member from group

All functions use `SECURITY DEFINER` to bypass RLS and enforce permissions.

## Security Model

### family_members Table
- **RLS:** Disabled (prevents infinite recursion)
- **Access:** Only through `SECURITY DEFINER` functions
- **Security:** Functions validate permissions before operations

### family_group_invites Table
- **RLS:** Enabled
- **Policies:**
  - Anyone can read valid invite codes
  - Users can create codes for their groups
  - Users can delete their own codes

### Why This Is Secure
1. All access goes through controlled functions
2. Functions have built-in permission checks
3. No direct table access from application
4. Audit trail through function calls
5. No infinite recursion issues

## Troubleshooting

### Can't connect to Supabase
- Check `.env.local` has correct URL and key
- Verify Supabase project is active
- Check network connection

### Database errors
- Apply all migrations in order
- Check Supabase logs for details
- Verify tables exist: `SELECT * FROM family_groups;`

### Google Sign-In not working
- Check redirect URLs in Google Console
- Check redirect URLs in Supabase
- Verify OAuth credentials are correct
- Clear browser cache and try again

### Invite codes not working
- Apply migrations (especially `20241202000001`)
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'generate_invite_code';`
- Verify permissions: `SELECT has_function_privilege('generate_invite_code()', 'execute');`

### Boards not loading
- Check browser console for errors
- Verify user is authenticated
- Check Supabase connection
- Try clearing local storage

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Supabase locally (optional)
npx supabase start
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Check this README first
- Search existing GitHub issues
- Open a new issue with details
- Include error messages and steps to reproduce

## Acknowledgments

Built with ❤️ for accessible communication. Special thanks to the open-source community for the amazing tools and libraries.

---

**Ready to get started?** Follow the Quick Start guide above and you'll be creating communication boards in minutes! 🎉
