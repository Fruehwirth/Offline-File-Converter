# GitHub Pages Deployment Guide

This guide explains how to deploy your Offline File Converter to GitHub Pages.

## 🎯 What's Been Configured

All necessary files have been configured for GitHub Pages deployment:

1. ✅ **Base path** set in `vite.config.ts` to `/offline-file-converter/`
2. ✅ **Service Worker** (`public/sw.js`) to enable COOP/COEP headers for FFmpeg.wasm
3. ✅ **GitHub Actions workflow** (`.github/workflows/deploy.yml`) for automatic deployment
4. ✅ **CSP updated** to allow Service Worker
5. ✅ **FFmpeg paths** updated to use base URL
6. ✅ **`.nojekyll`** file added to prevent Jekyll processing

## 📋 Deployment Steps

### Option 1: Automatic Deployment (Recommended)

This will automatically deploy whenever you push to the `main` branch.

#### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your repository: https://github.com/fruehwirth/offline-file-converter
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select:
   - **Source**: GitHub Actions
4. Click **Save**

#### Step 2: Push Your Changes

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

#### Step 3: Monitor Deployment

1. Go to **Actions** tab in your repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Once complete (✅ green checkmark), your site will be live at:

   **https://fruehwirth.github.io/offline-file-converter/**

⏱️ First deployment takes ~2-3 minutes.

---

### Option 2: Manual Deployment

If you prefer manual control:

#### Step 1: Build Locally

```bash
npm run build
```

#### Step 2: Deploy with GitHub CLI

```bash
# Install GitHub CLI if you haven't: https://cli.github.com/
gh workflow run deploy.yml
```

---

## 🧪 Test Before Deploying

Always test locally first:

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

Then visit http://localhost:4173 and verify:

- ✅ All conversions work
- ✅ FFmpeg conversions complete successfully
- ✅ No console errors
- ✅ Files download correctly

---

## 🔧 Troubleshooting

### FFmpeg Not Working on GitHub Pages

**Symptom**: "SharedArrayBuffer is not defined" error

**Solution**: The Service Worker must be registered. Check:

1. Browser DevTools → Application → Service Workers
2. Ensure `sw.js` is registered and activated
3. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### 404 Errors for Assets

**Symptom**: CSS, JS, or other assets return 404

**Solution**:

- Verify `base: '/offline-file-converter/'` in `vite.config.ts`
- Check that `.nojekyll` exists in `public/` folder
- Clear browser cache and hard refresh

### CORS or CSP Errors

**Symptom**: "Blocked by Content Security Policy"

**Solution**:

- Check Service Worker is active (handles headers)
- Verify CSP in `index.html` allows necessary resources
- Check browser console for specific directive violations

### Deployment Workflow Fails

**Symptom**: GitHub Actions workflow fails

**Solution**:

1. Check Actions tab for specific error
2. Verify GitHub Pages is enabled in Settings
3. Ensure repository has necessary permissions
4. Check `package.json` has `npm ci` compatible lock file

---

## 🎨 Development vs Production

- **Development** (`npm run dev`):
  - Base URL: `/`
  - COOP/COEP via Vite dev server
  - No Service Worker

- **Production** (`npm run build`):
  - Base URL: `/offline-file-converter/`
  - COOP/COEP via Service Worker
  - Service Worker registered

To test production behavior locally:

```bash
npm run build
npm run preview
```

---

## 🔄 Updating the Deployed Site

Simply push to `main`:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

GitHub Actions will automatically rebuild and redeploy! 🚀

---

## 📊 Monitoring

- **Deployment status**: GitHub Actions tab
- **Live site**: https://fruehwirth.github.io/offline-file-converter/
- **Build logs**: Click on workflow run → build/deploy jobs

---

## ⚠️ Important Notes

1. **First visit may require refresh**: Service Worker registration needs initial page load
2. **HTTPS only**: Service Workers require HTTPS (GitHub Pages provides this)
3. **Browser compatibility**: Modern browsers only (Chrome 88+, Firefox 79+, Safari 15.2+)
4. **No custom domain headers**: If you use a custom domain, ensure DNS supports GitHub Pages
5. **Cache busting**: Vite automatically adds hashes to filenames for cache busting

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Site loads at https://fruehwirth.github.io/offline-file-converter/
- [ ] Service Worker registered (DevTools → Application → Service Workers)
- [ ] Can drop files and see them in file list
- [ ] Image conversions work (PNG → ICO, etc.)
- [ ] Audio conversions work (including FFmpeg-based ones)
- [ ] Downloads work correctly
- [ ] Theme toggle works
- [ ] No console errors
- [ ] All UI elements render correctly

---

## 🆘 Need Help?

1. Check GitHub Actions logs for build errors
2. Check browser console for runtime errors
3. Open an issue with:
   - Error message
   - Browser and version
   - Steps to reproduce
   - Screenshot if applicable

Happy deploying! 🚀
