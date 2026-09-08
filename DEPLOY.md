# Deploy — get jessecaron on a permanent link

Host the **app on Vercel** (free, built for Next.js). **Supabase is already hosted** — no change.
The repo is already initialised and committed; `.env.local` is gitignored (secrets stay local).

## Recommended: GitHub → Vercel (auto-deploys on every push)

1. **Create an empty GitHub repo** at https://github.com/new — name it `jessecaron`, leave it empty
   (no README/.gitignore), Private is fine.

2. **Push this project** (run in `C:\Users\J\jessecaron`):
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/jessecaron.git
   git push -u origin main
   ```

3. **Import to Vercel** — go to https://vercel.com → sign in with GitHub → **Add New → Project**
   → pick the `jessecaron` repo → Framework auto-detects **Next.js** → **before clicking Deploy**,
   open **Environment Variables** and add the three below → **Deploy**.

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://aobjodqnnuzueblcjcka.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_LuoYnlBNK4jxmfqKc_cL4g_NBVnHLSM` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(Supabase Dashboard → Project Settings → API → `service_role`)* |

   You get a live URL like `https://jessecaron.vercel.app` in ~2 minutes. Every `git push` redeploys.

## Faster one-off: Vercel CLI (no GitHub)

```bash
npm i -g vercel
cd C:\Users\J\jessecaron
vercel            # logs in via browser, links project, first deploy (preview)
vercel --prod     # promote to the permanent production URL
```
Add the 3 env vars when prompted, or in the dashboard afterwards (Settings → Environment Variables),
then run `vercel --prod` again.

## REQUIRED after first deploy — point Supabase Auth at the live domain

Otherwise magic-link / login redirects break in production.
Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://<your-vercel-domain>` (e.g. `https://jessecaron.vercel.app`)
- **Redirect URLs:** add `https://<your-vercel-domain>/**`

(The `/auth/callback` route already uses the request's own origin, so it adapts automatically once
the domain is allow-listed.)

## Custom domain (e.g. www.jessecaron.com)

Vercel → Project → **Settings → Domains** → add the domain and follow the DNS records shown
(an `A`/`CNAME` at your registrar). Then update the Supabase Site URL / Redirect URLs to that domain too.
Free Vercel includes automatic HTTPS.

## Notes
- Free tiers (Vercel Hobby + Supabase Free) are enough to launch. Supabase free projects pause after
  ~1 week of inactivity — the first visit wakes them; upgrade to Pro to keep always-on.
- Don't commit `.env.local`. Env values live in Vercel's dashboard for production.
