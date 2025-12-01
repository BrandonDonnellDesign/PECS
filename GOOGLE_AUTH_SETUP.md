# Google OAuth Setup Guide

This guide will help you enable Google Sign-In for your PECS Creator app.

## Prerequisites

- A Supabase project
- A Google Cloud account

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name: "PECS Creator"
   - Add your email as support email
   - Add authorized domains (if using custom domain)
   - Click **Save and Continue**
4. For Application type, select **Web application**
5. Name it "PECS Creator Web Client"

### 1.4 Add Authorized Redirect URIs
Add these redirect URIs (replace `YOUR_PROJECT_REF` with your Supabase project reference):

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

For local development, also add:
```
http://localhost:54321/auth/v1/callback
```

6. Click **Create**
7. Copy the **Client ID** and **Client Secret** (you'll need these)

## Step 2: Configure Supabase

### 2.1 Add Google Provider
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** in the list
5. Toggle it to **Enabled**

### 2.2 Add Credentials
1. Paste your **Client ID** from Google
2. Paste your **Client Secret** from Google
3. Click **Save**

### 2.3 Configure Redirect URLs (Optional)
If using a custom domain:
1. Go to **Authentication** > **URL Configuration**
2. Add your site URL: `https://yourdomain.com`
3. Add redirect URLs: `https://yourdomain.com/**`

## Step 3: Update Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click "Continue with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### "Redirect URI mismatch" Error
- Make sure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL
- Check for trailing slashes or typos
- Wait a few minutes after adding URIs (changes can take time to propagate)

### "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Add test users if your app is in testing mode
- Verify the OAuth consent screen is published

### User not created in database
- Check that the `handle_new_user()` trigger is working
- Verify the profiles table exists
- Check Supabase logs for errors

### "Supabase not configured" Error
- Verify your environment variables are set correctly
- Restart your development server after changing `.env.local`
- Check that `NEXT_PUBLIC_` prefix is used for client-side variables

## Security Best Practices

1. **Never commit credentials**: Keep your `.env.local` file in `.gitignore`
2. **Use environment variables**: Don't hardcode API keys
3. **Restrict OAuth scopes**: Only request necessary permissions
4. **Enable email verification**: In Supabase Auth settings
5. **Set up rate limiting**: Prevent abuse of authentication endpoints
6. **Use HTTPS in production**: Always use secure connections

## Additional Providers

The code also supports other OAuth providers. To enable them:

### GitHub
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Add callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. Add to Supabase Auth > Providers > GitHub

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI
5. Copy App ID and Secret
6. Add to Supabase Auth > Providers > Facebook

## Testing OAuth Locally

For local development with Supabase CLI:

1. Start Supabase locally:
   ```bash
   npx supabase start
   ```

2. Get the local API URL and anon key:
   ```bash
   npx supabase status
   ```

3. Update `.env.local` with local credentials

4. Add local redirect URI to Google Console:
   ```
   http://localhost:54321/auth/v1/callback
   ```

## Production Deployment

When deploying to production:

1. Update Google OAuth redirect URIs with production URL
2. Update Supabase site URL in Auth settings
3. Set production environment variables
4. Test the OAuth flow thoroughly
5. Monitor authentication logs

## Support

If you encounter issues:
- Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Check Supabase logs in Dashboard > Logs
- Verify network requests in browser DevTools

---

**Note**: OAuth configuration changes can take a few minutes to propagate. If something doesn't work immediately, wait a few minutes and try again.
