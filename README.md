<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1n1h3WOoYhoh1Mya_q2Xw87SAttJVu-Nk

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill in the values below.
3. Run the app:
   `npm run dev`

## Environment variables

Set the following environment variables (locally in `.env.local`, or in Netlify):

| Variable | Purpose |
| --- | --- |
| `VITE_GEMINI_API_KEY` | API key for Gemini requests. |
| `VITE_FIREBASE_API_KEY` | Firebase API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain (e.g. `your-project.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket (e.g. `your-project.appspot.com`). |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Firebase app ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID. |

## Deploy to Netlify

Configure the environment variables in your Netlify site so the build receives the Firebase and Gemini credentials:

```bash
netlify env:set VITE_GEMINI_API_KEY <your-gemini-api-key>
netlify env:set VITE_FIREBASE_API_KEY <your-firebase-api-key>
netlify env:set VITE_FIREBASE_AUTH_DOMAIN <your-project.firebaseapp.com>
netlify env:set VITE_FIREBASE_PROJECT_ID <your-project-id>
netlify env:set VITE_FIREBASE_STORAGE_BUCKET <your-project.appspot.com>
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID <your-messaging-sender-id>
netlify env:set VITE_FIREBASE_APP_ID <your-app-id>
netlify env:set VITE_FIREBASE_MEASUREMENT_ID <your-measurement-id>
```

These Firebase variables are required for the app to sync with Firestore; if they are absent, the app will stay in local-only mode.

The build command remains `npm run build` and publishes the `dist` directory. Secrets stay in Netlify's environment and are not checked into version control.

## Keeping secrets out of Git

- Never hardcode API keys in the source code; access them through `import.meta.env.VITE_*` as shown in `firebase.ts` and `components/AIAdvisor.tsx`.
- Keep `.env` and other environment files untracked (the `.gitignore` already ignores them). If you accidentally committed one, clean it with:

```bash
git rm -r --cached .env*
git commit -m "Remove env files from Git"
```
