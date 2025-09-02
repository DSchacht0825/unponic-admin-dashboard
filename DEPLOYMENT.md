# Deployment Guide - San Diego Rescue Mission Admin Dashboard

## Prerequisites

1. ✅ Supabase project created at https://supabase.com
2. ✅ Project URL: `https://cedpadbflumqvuwfhxoz.supabase.co`
3. ✅ Environment variables configured in `.env.local`

## Database Setup

### Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration to create the `clients` table and policies

### Step 2: Import Existing Data

1. Start the development server: `npm start`
2. Navigate to "Data Migration" in the admin dashboard
3. Click "Import Client Data" to migrate data from `clientsData.json`

## Environment Setup

The app requires these environment variables in `.env.local`:

```
REACT_APP_SUPABASE_URL=https://cedpadbflumqvuwfhxoz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to Netlify:
   - Go to https://netlify.com
   - Drag and drop the `build` folder
   - Add environment variables in Site Settings > Environment Variables

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Add environment variables in the Vercel dashboard

### Option 3: GitHub Pages (Static)

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json:
   ```json
   {
     "homepage": "https://yourusername.github.io/admin-dashboard",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Security Considerations

1. **Row Level Security**: Enabled on the clients table
2. **Environment Variables**: Never commit `.env.local` to git
3. **Authentication**: Currently open access - implement auth before production use
4. **API Keys**: Using anon key which is safe for client-side use with RLS

## Production Recommendations

1. **Add Authentication**: Implement Supabase Auth for user login
2. **User Roles**: Create admin/user role system
3. **Data Validation**: Add form validation and sanitization
4. **Error Handling**: Implement comprehensive error handling
5. **Monitoring**: Add error tracking (e.g., Sentry)
6. **Backup Strategy**: Regular database backups
7. **SSL Certificate**: Ensure HTTPS in production

## Testing the Deployment

1. ✅ Database connection works
2. ✅ Client data loads from Supabase
3. ✅ CRUD operations function correctly
4. ⏳ Search functionality works
5. ⏳ Data migration completes successfully

## Troubleshooting

### Database Connection Issues
- Check environment variables are set correctly
- Verify Supabase project URL and API key
- Ensure RLS policies allow access

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run build`
- Verify all imports are correct

### Deployment Issues
- Ensure environment variables are set in deployment platform
- Check build logs for errors
- Verify static files are served correctly

## Support

For issues with this deployment:
1. Check Supabase dashboard for database errors
2. Review browser console for client-side errors
3. Check deployment platform logs