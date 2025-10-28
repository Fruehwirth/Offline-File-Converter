# 🚀 Deployment Setup (Custom Domain)

## What's Been Configured

Everything is configured for deployment to a custom domain (localconvert.org). Here's what's set up:

### Files Modified

- ✅ `vite.config.ts` - Base path set to `/` for custom domain
- ✅ `src/main.tsx` - Service Worker registration configured
- ✅ `index.html` - Updated CSP for Service Worker support
- ✅ `src/features/conversion/audioProcessing.ts` - FFmpeg paths configured

### Files Created

- ✅ `public/sw.js` - Service Worker for COOP/COEP headers (FFmpeg support)
- ✅ `public/.nojekyll` - Prevents Jekyll processing
- ✅ `.github/workflows/deploy.yml` - Automatic deployment workflow

---

## 🎯 Your Action Items (5 Minutes)

### 1️⃣ Enable GitHub Pages (2 min)

1. Visit: https://github.com/fruehwirth/offline-file-converter/settings/pages
2. Under **"Build and deployment"** → **"Source"**:
   - Select: **GitHub Actions** (not "Deploy from a branch")
3. That's it! No other settings needed.

### 2️⃣ Push Changes (1 min)

```bash
git add .
git commit -m "Configure GitHub Pages deployment with Service Worker"
git push origin main
```

### 3️⃣ Wait for Deployment (2 min)

1. Go to: https://github.com/fruehwirth/offline-file-converter/actions
2. Watch the workflow run (takes ~2-3 minutes first time)
3. Once complete, visit: **https://localconvert.org**

---

## ✅ How to Verify It's Working

Visit your deployed site and test:

1. **Drop a PNG file** → Convert to ICO ✅
2. **Drop an MP3 file** → Convert to WAV (uses FFmpeg) ✅
3. **Check DevTools Console** → Should see "Service Worker registered" ✅
4. **Check Application Tab** → Service Worker should be active ✅

---

## 🔄 Future Updates

Every time you push to `main`, GitHub automatically rebuilds and redeploys:

```bash
# Make your changes
git add .
git commit -m "Add new feature"
git push origin main
# ✨ Auto-deploys in ~2 minutes
```

---

## 🧪 Test Locally First

Before pushing, always test the production build:

```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to verify everything works.

---

## ⚡ Why the Service Worker?

GitHub Pages doesn't allow custom HTTP headers, but FFmpeg.wasm requires:

- `Cross-Origin-Embedder-Policy: credentialless`
- `Cross-Origin-Opener-Policy: same-origin`

The Service Worker (`public/sw.js`) intercepts requests and adds these headers, enabling FFmpeg to work! 🎉

---

## 🎓 Important Notes

- **Local dev and production**: Both use `/` base path (custom domain)
- **Service Worker**: Only registers in production (not in dev mode)
- **First visit**: May need one refresh for Service Worker to activate
- **Custom domain**: Site is deployed at localconvert.org

---

## 🆘 If Something Goes Wrong

### Check 1: Is GitHub Pages enabled?

https://github.com/fruehwirth/offline-file-converter/settings/pages

### Check 2: Did the workflow run?

https://github.com/fruehwirth/offline-file-converter/actions

### Check 3: Is Service Worker active?

DevTools → Application → Service Workers → Should see `sw.js`

### Check 4: Any console errors?

DevTools → Console → Look for red errors

---

## 📞 Need the Full Guide?

See `DEPLOYMENT.md` for detailed troubleshooting and advanced options.

---

## 🎉 That's It!

You're ready to deploy. Just:

1. Enable GitHub Pages (Actions source)
2. Push your changes
3. Wait 2 minutes
4. Visit your site!

**Your site is live at**: https://localconvert.org

Good luck! 🚀
