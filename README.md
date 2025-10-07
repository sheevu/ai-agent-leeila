# Leeila AI – Sales & Query Assistant

Leeila AI is a guided assistant for Sudarshan AI Labs. It greets prospects in Hindi and English, recommends the right growth package, captures sales leads, and walks founders through onboarding flows such as Udyam/MSME and GST registration.

The experience runs fully on the front-end (React + Vite) with deterministic flows optimised for mobile and desktop. Leads are pushed to Google Sheets (or any CRM) through an automation webhook (`n8n`, `Make`, Zapier, etc.).

## ✨ What's inside

- Conversational UI with a vibrant Sudarshan-branded palette and the Leeila lotus emblem (`src/assets/leeila-logo.svg`).
- Multilingual voice agent: tap the mic to speak (Hindi or English), toggle 🔊 to hear Leeila reply aloud.
- Package catalogue with quick actions for seven pre-defined growth packs.
- Automated sales capture (Package → Name → Phone → Business Type → City) with confirmation before submission.
- Onboarding agent that collects business profile, location, registrations, and revenue band.
- Webhook integration for lead forwarding with guardrails for missing configuration or HTTP failures.

## 🧭 Conversation flows

### 1. Sales & query assistant
1. Greets the visitor and lists all packaged offerings.
2. Starts “Lead capture” on demand with smart quick replies.
3. Collects Package → Name → Phone → Business Type → City.
4. Shows a structured summary with confirm / edit / reset options.
5. Sends payload to `VITE_LEAD_WEBHOOK_URL` and re-surfaces the main menu.

### 2. Onboarding & form agent
1. Lets the visitor pick a track: `Udyam/MSME`, `GST`, or `Sudarshan Portal`.
2. Collects owner name, business name, contact, city/state.
3. Captures business profile (type, years active, existing registrations, revenue band).
4. Summarises everything before submitting to the webhook.

Both flows can be restarted anytime (`reset`, `restart`) and the assistant can switch context via quick replies.

## 🎙️ Voice agent

- **Mic button (🎙️)**: Start/stop speech recognition. Leeila auto-detects Hindi (hi-IN) vs English (en-IN).
- **Speaker button (🔊)**: Toggle spoken assistant responses. Leeila narrates messages in the visitor’s detected language.
- Live transcript pill echoes what the browser hears before the message is posted.
- Built on the browser’s Web Speech API; no external keys required. Users must grant microphone permission.

## 🚀 Getting started locally

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Type-check and build for production
npm run build

# (optional) Preview the production build locally
npm run preview
```

The dev server boots at <http://localhost:5173>. Hot Module Replacement (HMR) is enabled by default.

## 🔗 Webhook & Sheets automation

1. Duplicate `.env.example` → `.env` and update the webhook:
   ```bash
   VITE_LEAD_WEBHOOK_URL=https://hook.your-automation-platform.com/lead
   ```
2. In `n8n`/`Make`/Zapier create a “Catch Hook” trigger. The assistant will POST a JSON body shaped like:
   ```json
   {
     "source": "Leeila Sales Assistant",
     "flow": "sales",
     "capturedAt": "2025-10-08T00:00:00.000Z",
     "packageInterest": "🚀 Kick-Start Pack",
     "name": "Asha Sharma",
     "phone": "9876543210",
     "businessType": "Retail",
     "city": "Pune"
   }
   ```
   The onboarding flow uses `flow: "onboarding"` with the extended registration fields.
3. Map the payload to **Google Sheets → Add Row** (or your CRM of choice). Recommended columns:
   `capturedAt`, `flow`, `packageInterest`, `name`, `phone`, `businessType`, `city`,
   `track`, `businessName`, `state`, `yearsInBusiness`, `existingRegistration`, `revenueBand`.
4. Optional safeguards in the workflow:
   - Validate phone numbers with Regex (`^\d{10}$`).
   - Add run-after error notifications to WhatsApp / Slack if the sheet write fails.
   - Fan-out to CRM (HubSpot, Zoho) or send an email to the Sudarshan sales desk.

If `VITE_LEAD_WEBHOOK_URL` is not set or responds with a non-`2xx` status, Leeila informs the visitor that the submission could not be completed and leaves the data onscreen so an agent can follow up manually.

## ☁️ Deploying

The project is static and can be hosted on any modern platform (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).

1. Build the app: `npm run build` (outputs to `dist/`).
2. Deploy the `dist` folder using your platform’s CLI or drag-and-drop uploader.
3. Remember to inject `VITE_LEAD_WEBHOOK_URL` as an environment variable on the hosting provider so the live build can reach your automation workflow.

For containerised environments, serve the `dist` directory with any static server (e.g., `npm install -g serve` then `serve dist`). No server-side runtime is required.

## 🛠 Customising Leeila

- Update offers: edit the `packages` array in `src/App.tsx` (labels, pricing, descriptions).
- Tweak prompts: modify the content strings inside the flow handlers for tone or language.
- Add fields: extend the `SalesLead` / `OnboardingData` interfaces and update the corresponding steps before the summary card.
- Branding: adjust colours, gradients, and typography in `src/App.css` and `src/index.css`.
- Voice UX: adapt the heuristics in `src/App.tsx` (locale detection, speech content) to fit your audience.

## ✅ Status

- ✅ Type-checked build (`npm run build`)
- ✅ Voice and chat linting (`npm run lint`)
- ✅ Responsive layout (verified at ≤768px)
- ✅ Webhook guardrails (missing URL / HTTP errors)

Have fun demoing Leeila AI! 🙌
