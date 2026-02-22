<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `.env.local`:
   ```env
   VITE_API_BASE_URL=https://your-backend-domain.com
   VITE_TRANSLATE_API_URL=https://your-backend-domain.com/translate
   VITE_IMAGE_BASE_URL=https://your-cdn-or-storage-domain.com
   VITE_MAX_IMAGE_MB=3
   ```
3. Run the app:
   `npm run dev`

## Image upload architecture

Admin now uploads images to cloud storage via backend signed endpoint:

- Frontend calls `POST /uploads/sign`
- Then uploads file directly to Cloudinary
- App stores only image URL in DB

Backend env required:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (optional)

## Admin Login Requirements

Admin panel now uses backend authentication (`/auth/login` + JWT).

1. Backend `.env`da `ADMIN_EMAILS`ga admin email qo'shing.
2. O'sha email bilan shop auth orqali account yarating (register + verify).
3. Shu email/parol bilan admin panelga kiring.
# Star-Store-Admin-ponel
