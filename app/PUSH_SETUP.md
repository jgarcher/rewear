# Push Notifications — One-Time Setup

ReWear uses Web Push for borrow-flow notifications (request received,
approved, returned). Works in Chrome on Android and Safari on iPhone
**only when ReWear is installed to the home screen** (Apple's rule).

## 1. Generate VAPID keys (one time)

From `app/`:

```bash
npx web-push generate-vapid-keys
```

You'll get something like:

```
Public Key:
BNb...long-base64-string

Private Key:
HzQ...another-base64-string
```

## 2. Add the keys to your environments

### Local dev — `.env.local`

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNb...
VAPID_PRIVATE_KEY=HzQ...
VAPID_SUBJECT=mailto:hello@rewear.app
```

### Vercel (production)

Project → **Settings** → **Environment Variables** → add three:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Production + Preview + Development)
- `VAPID_PRIVATE_KEY` (Production + Preview, **never check into git**)
- `VAPID_SUBJECT` — usually `mailto:` your support email

Redeploy after adding (`Settings → Deployments → ... → Redeploy`).

## 3. User flow

1. User opens **Profile → Settings**
2. Taps **Turn on notifications** in the Notifications card
3. Browser prompts for permission, user accepts
4. Subscription saved to `push_subscriptions` table

From now on, that device gets a notification when a friend asks to
borrow / approves / declines / marks received / marks returned.

## 4. iOS specifics

- Must be installed via Safari → Share → Add to Home Screen first.
  Push won't work in regular Safari tabs (Apple restriction).
- Once installed, the user opens the home-screen icon and runs the
  Turn-on-notifications flow above.

## 5. If push isn't configured

If you skip the env vars, the app keeps working — `sendPushToUser`
silently no-ops. The settings UI shows a "Server isn't configured yet"
hint. No errors thrown anywhere.
