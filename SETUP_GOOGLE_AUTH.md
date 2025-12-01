# Quick Google OAuth Setup

## ⚠️ SECURITY WARNING

**NEVER commit API keys or secrets to your code repository!**

The Google OAuth Client Secret you shared should be kept private and only added to Supabase.

## Setup Steps

### 1. Add Google OAuth to Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and toggle it to **Enabled**
5. Add your credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: `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`
6. Click **Save**

### 2. Configure Redirect URLs

In Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_PROJECT_REF` with your actual Supabase project reference

### 3. Test the Integration

1. Start your app: `npm run dev`
2. Go to the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected back to your app

## Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security Best Practices

✅ **DO**:
- Keep secrets in Supabase dashboard
- Use environment variables for configuration
- Add `.env.local` to `.gitignore`
- Rotate secrets if accidentally exposed

❌ **DON'T**:
- Commit secrets to Git
- Share secrets publicly
- Hardcode API keys in code
- Use production secrets in development

## Troubleshooting

### "Redirect URI mismatch"
- Verify the redirect URI in Google Console matches Supabase exactly
- Check for typos or trailing slashes
- Wait a few minutes for changes to propagate

### "Invalid client"
- Double-check Client ID and Secret in Supabase
- Ensure Google OAuth is enabled in Supabase
- Verify the OAuth consent screen is configured

### Still having issues?
See the full guide: [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)

---

**Note**: If you accidentally exposed your secret publicly (like in a chat or commit), you should:
1. Go to Google Cloud Console
2. Delete the current OAuth credentials
3. Create new credentials
4. Update Supabase with the new secret
