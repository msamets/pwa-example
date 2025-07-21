# Firebase FCM Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Firebase Project Configuration
# Get these from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# VAPID Key for Web Push
# Get from Firebase Console > Project Settings > Cloud Messaging > Web configuration
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Server-side Firebase Configuration (for admin SDK)
FIREBASE_PRIVATE_KEY="your_private_key_here"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project_id.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id
```

## Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "job-seeker-pwa")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Cloud Messaging
1. In your Firebase project, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. If prompted, enable the Cloud Messaging API

### 3. Add Web App to Firebase Project
1. In Firebase Console, click the **Web** icon (`</>`) to add a web app
2. Enter app nickname (e.g., "Job Seeker PWA")
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the configuration object - you'll need these values for your `.env.local`

### 4. Generate VAPID Key
1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Scroll to **Web configuration** section
3. Click "Generate key pair" if no VAPID key exists
4. Copy the key pair value - this is your `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### 5. Create Service Account (for server-side FCM)
1. Go to **Project Settings** > **Service accounts** tab
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the following values for your `.env.local`:
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `project_id` → `FIREBASE_PROJECT_ID`

### 6. Domain Authorization (for production)
1. Go to **Project Settings** > **Cloud Messaging**
2. Add your production domain to "Authorized domains"
3. For local development, `localhost` should work automatically

## Testing Your Setup

After setting up the environment variables:

1. Restart your development server
2. Open browser DevTools and check the Console
3. Navigate to `/notifications` page
4. You should see Firebase initialization logs
5. Try requesting notification permissions

## Security Notes

- Keep your service account private key secure
- Never commit `.env.local` to version control
- Use environment-specific configurations for different deployments
- Regularly rotate your VAPID keys and service account keys

## Common Issues

### "Firebase Messaging not supported"
- Ensure you're using HTTPS (or localhost for development)
- Check browser compatibility
- Verify Firebase SDK is properly installed

### "No registration token available"
- Ensure notification permissions are granted
- Check that the app is focused when requesting tokens
- Verify VAPID key is correct

### "Invalid sender ID"
- Verify `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` is correct
- Check that Cloud Messaging is enabled in Firebase Console

### "Unauthorized"
- Verify service account credentials are correct
- Ensure the service account has proper permissions
- Check that the private key format is correct (includes `\n` characters)