# Deployment Instructions

This document provides step-by-step instructions for deploying the Pragmatica website to Netlify with a custom domain from Cloudflare.

## Prerequisites

- GitHub account with access to this repository
- Netlify account (free tier is sufficient)
- Cloudflare account with `pragmatica.dev` domain configured
- Node.js 18+ installed for local testing

## Part 1: Netlify Setup

### 1.1 Create Netlify Site

1. Go to [Netlify](https://netlify.com) and log in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub repositories
5. Select the `coding-technology` repository
6. Configure build settings:
   - **Base directory**: `website`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `website/dist`
7. Click **"Deploy site"**

Netlify will assign a random subdomain like `random-name-123456.netlify.app`.

### 1.2 Configure Environment Variables

For GitHub Actions to deploy automatically, you need to add secrets to your GitHub repository:

1. In Netlify, go to **Site settings** → **Site information**
2. Copy your **Site ID** (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Go to **User settings** → **Applications** → **Personal access tokens**
4. Click **"New access token"** and create a token with full access
5. Copy the token (you won't be able to see it again)

Now add these to GitHub:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** and add:
   - Name: `NETLIFY_AUTH_TOKEN`, Value: (paste your Netlify token)
   - Name: `NETLIFY_SITE_ID`, Value: (paste your Site ID)

### 1.3 Test Deployment

Push a commit to the `main` branch. GitHub Actions should:
- Build the website
- Deploy it to Netlify

Check the **Actions** tab in GitHub to monitor the deployment progress.

## Part 2: Cloudflare DNS Configuration

### 2.1 Add CNAME Records

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain `pragmatica.dev`
3. Go to **DNS** → **Records**
4. Add the following DNS records:

#### For apex domain (pragmatica.dev):

**Option A - Using CNAME with Cloudflare Flattening (Recommended):**
- **Type**: CNAME
- **Name**: `@` (or `pragmatica.dev`)
- **Target**: `random-name-123456.netlify.app` (your Netlify domain)
- **Proxy status**: Proxied (orange cloud)
- **TTL**: Auto

**Option B - Using A Record:**
- **Type**: A
- **Name**: `@`
- **IPv4 address**: `75.2.60.5` (Netlify load balancer)
- **Proxy status**: Proxied (orange cloud)
- **TTL**: Auto

#### For www subdomain:

- **Type**: CNAME
- **Name**: `www`
- **Target**: `random-name-123456.netlify.app` (your Netlify domain)
- **Proxy status**: Proxied (orange cloud)
- **TTL**: Auto

### 2.2 Configure Netlify Domain

1. Go back to Netlify → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter `pragmatica.dev` and click **"Verify"**
4. Netlify will check DNS configuration
5. Repeat for `www.pragmatica.dev`

### 2.3 Enable HTTPS

1. In Netlify → **Site settings** → **Domain management** → **HTTPS**
2. Netlify should automatically provision a Let's Encrypt SSL certificate
3. Enable **"Force HTTPS"** to redirect HTTP to HTTPS

### 2.4 Cloudflare SSL Settings

1. In Cloudflare → **SSL/TLS** → **Overview**
2. Set SSL mode to **"Full (strict)"**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON
   - **Minimum TLS Version**: 1.2 or higher

## Part 3: Verification

### 3.1 DNS Propagation

DNS changes can take up to 48 hours to propagate globally, but usually take 5-30 minutes.

Check DNS propagation:
```bash
# Check apex domain
dig pragmatica.dev

# Check www subdomain
dig www.pragmatica.dev
```

### 3.2 Test Website

Visit these URLs to verify everything works:
- https://pragmatica.dev
- https://www.pragmatica.dev
- http://pragmatica.dev (should redirect to HTTPS)
- http://www.pragmatica.dev (should redirect to HTTPS)

### 3.3 Test Automatic Deployment

1. Make a small change to `README.md`
2. Commit and push to `main` branch
3. Check GitHub Actions to verify the workflow runs
4. Verify the change appears on the live website within 2-3 minutes

## Part 4: Local Development

### 4.1 Install Dependencies

```bash
cd website
npm install
```

### 4.2 Build Website

```bash
npm run build
```

### 4.3 Preview Locally

```bash
npm run dev
```

Open http://localhost:8000 in your browser.

### 4.4 Clean Build

```bash
npm run clean
npm run build
```

## Troubleshooting

### Issue: "Site not found" error

**Solution**: Check that DNS records are correct and propagated. Use `dig` or online DNS checker tools.

### Issue: SSL certificate errors

**Solution**:
1. Verify Cloudflare SSL mode is set to "Full (strict)"
2. Check that Netlify has provisioned SSL certificate
3. Wait a few minutes for certificate propagation

### Issue: Build fails in GitHub Actions

**Solution**:
1. Check the Actions tab for error logs
2. Verify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets are set correctly
3. Test the build locally with `npm run build`

### Issue: CSS/styling not loading

**Solution**:
1. Check browser console for 404 errors
2. Verify `style.css` exists in `website/dist/`
3. Check template paths use correct `{{NAV_CONTEXT}}` placeholders

### Issue: Links broken between pages

**Solution**:
1. Verify all `.md` links are converted to `.html` in build script
2. Check that series pages use `../` prefix correctly
3. Test navigation locally before deploying

## Maintenance

### Updating Content

1. Edit markdown files in project root or `series/` directory
2. Commit and push changes
3. GitHub Actions will automatically rebuild and deploy

### Updating Styles

1. Edit `website/styles/style.css`
2. Test locally with `npm run dev`
3. Commit and push changes

### Updating Templates

1. Edit `website/templates/page.html`
2. Rebuild locally to verify
3. Commit and push changes

## Monitoring

### Netlify Analytics

- Go to Netlify → **Analytics** to view:
  - Page views
  - Unique visitors
  - Top pages
  - Bandwidth usage

### Cloudflare Analytics

- Go to Cloudflare → **Analytics & Logs** to view:
  - Traffic statistics
  - Security threats blocked
  - Performance metrics

## Rollback

If a deployment breaks the site:

1. In Netlify → **Deploys**
2. Find the last working deployment
3. Click **"..."** → **"Publish deploy"**
4. The site will immediately rollback to that version

Or revert the Git commit:

```bash
git revert HEAD
git push origin main
```

## Support

- **Netlify Documentation**: https://docs.netlify.com
- **Cloudflare Documentation**: https://developers.cloudflare.com
- **GitHub Actions Documentation**: https://docs.github.com/actions

---

**Last Updated**: 2025-01-07
