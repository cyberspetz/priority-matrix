# Deployment Guide for Priority Matrix

This guide provides step-by-step instructions for deploying the Eisenhower Matrix Task Manager to Vercel with Supabase backend.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Supabase](https://supabase.com) account
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up Supabase Database

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and fill in project details
   - Wait for the project to be created

2. **Create the tasks table:**
   - In your Supabase dashboard, go to the "SQL Editor"
   - Run the following SQL to create the tasks table:

   ```sql
   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     quadrant VARCHAR(50) NOT NULL CHECK (quadrant IN (
       'urgent-important',
       'not-urgent-important',
       'urgent-not-important',
       'not-urgent-not-important'
     )),
     is_completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Get your Supabase credentials:**
   - Go to Settings > API in your Supabase dashboard
   - Copy the "Project URL" and "Project API keys" (anon public key)

## Step 2: Prepare Your Local Environment

1. **Set up environment variables:**
   - Create a `.env.local` file in your project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Test locally:**
   ```bash
   npm run dev
   ```
   - Verify that the application works with your Supabase database

## Step 3: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard

1. **Push your code to Git:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import project to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect it as a Next.js project

3. **Configure environment variables:**
   - In the deployment configuration, expand "Environment Variables"
   - Add the following variables:
     - `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Your Supabase anon key

4. **Deploy:**
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your app will be available at a Vercel URL (e.g., `your-app.vercel.app`)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts to configure your project
   - Set up environment variables when prompted

## Step 4: Environment Variable Management in Vercel

### Adding Environment Variables via Dashboard:

1. Go to your project dashboard on Vercel
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Select "Production", "Preview", and "Development"

   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
   - **Environment**: Select "Production", "Preview", and "Development"

### Adding Environment Variables via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## Step 5: Verify Deployment

1. **Test the deployed application:**
   - Visit your Vercel deployment URL
   - Try creating, editing, and deleting tasks
   - Test the drag-and-drop functionality between quadrants

2. **Check the browser console for any errors**

3. **Verify data persistence:**
   - Create a task, refresh the page, and ensure it persists
   - Check your Supabase database to see the data

## Continuous Deployment

Once set up, Vercel will automatically redeploy your application whenever you push changes to your main branch.

## Troubleshooting

### Common Issues:

1. **Environment variables not working:**
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access
   - Redeploy after adding environment variables

2. **Supabase connection errors:**
   - Verify your Supabase URL and API key are correct
   - Check that your Supabase project is not paused

3. **Build errors:**
   - Check the Vercel build logs in the dashboard
   - Ensure all dependencies are in `package.json`

4. **Database permission errors:**
   - Verify Row Level Security (RLS) policies in Supabase
   - For development, you might need to disable RLS or set up proper policies

### Enable Row Level Security (Optional but Recommended):

If you want to add user authentication later, you can enable RLS:

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you should add proper policies later)
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
```

## Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Follow the DNS configuration instructions provided by Vercel

## Performance Optimization

Consider these optimizations for production:

1. **Enable caching** for static assets
2. **Optimize images** using Next.js Image component
3. **Add loading states** for better UX
4. **Implement error boundaries** for better error handling

Your Eisenhower Matrix Task Manager is now deployed and ready to use!