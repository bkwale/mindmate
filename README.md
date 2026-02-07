# MindMate

A calm, privacy-first emotional clarity tool. Not therapy. Not a chatbot. A space to reflect.

## Quick Start

### 1. Get your Anthropic API key

Go to [console.anthropic.com](https://console.anthropic.com) and create an account. Once you're in, go to **API Keys** and create a new key. Copy it.

### 2. Set up the project

```bash
cd mindmate
npm install
```

### 3. Add your API key

Open the file `.env.local` and replace the placeholder with your real key:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

---

## Deploy to Vercel (so friends can use it)

### Option A: Deploy from GitHub

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"** and select your repo
4. In the **Environment Variables** section, add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your API key
5. Click **Deploy**
6. Share the URL with your friends

### Option B: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel
```

When prompted, add your API key as an environment variable:

```bash
vercel env add ANTHROPIC_API_KEY
```

Then redeploy:

```bash
vercel --prod
```

---

## What's Built

- **Three entry modes**: "I need to think" (reflection), "I need to prepare" (conversation prep), "I just need a moment" (grounding)
- **Layered prompt architecture**: Base identity, session state, theme context, and safety layers
- **Session limits**: 5 exchanges for reflection, 7 for preparation, 3 for grounding
- **Safety detection**: Crisis language triggers resource redirection
- **Clarity signal**: Post-session "Did this help you think more clearly?" prompt
- **Session frequency monitoring**: Suggests a pause after 3 sessions in 2 hours
- **Calm, mobile-first UI**: No gamification, no streaks, no pull-to-refresh

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (custom calm colour palette)
- **Anthropic Claude API** (server-side, key never exposed to browser)
- **Local storage** (MVP data persistence — will be replaced with proper backend)

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # Claude API endpoint
│   ├── globals.css           # Styles + fonts
│   ├── layout.tsx            # Root layout + metadata
│   └── page.tsx              # Main app (state management)
├── components/
│   ├── Onboarding.tsx        # 3-screen onboarding flow
│   ├── Home.tsx              # Three doors home screen
│   ├── Session.tsx           # Reflection/prep/grounding sessions
│   └── ClarityPrompt.tsx     # Post-session clarity signal
└── lib/
    ├── prompts.ts            # Layered prompt architecture
    └── storage.ts            # Local storage helper (MVP)
```
