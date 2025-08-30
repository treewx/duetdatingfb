# 🚀 Duet Bot - Quick Start

## What's Built

✅ **Complete Facebook Messenger Bot** for dating app "Duet"
✅ **Profile Setup Flow** - Gender, preference, photo upload, bio
✅ **Couple Rating System** - Rate random couples as cute/not
✅ **Match Discovery** - See who you match with based on community votes
✅ **SQLite Database** - Stores profiles, ratings, and user states
✅ **Deployment Ready** - Works on Heroku, Render, Railway

## Files Created

- `app.js` - Main Express server with webhook endpoints
- `database.js` - SQLite database operations
- `messageHandler.js` - Messenger chat flows and API calls
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template
- `README.md` - Full setup instructions
- `Procfile` - Heroku deployment config

## Next Steps

1. **Setup Facebook App** (see README.md)
2. **Get Tokens** (Page Access Token, App Secret)
3. **Deploy** (Heroku/Render/Railway)
4. **Configure Webhook** in Facebook
5. **Test** by messaging your page

## Test Locally

```bash
npm install
cp .env.example .env
# Fill in your Facebook tokens in .env
npm run dev
# Use ngrok to expose localhost for webhook testing
```

## User Experience

1. User messages your Facebook page
2. Bot asks for profile (gender, preference, photo, bio)
3. User can type "View Couples" to rate random couples
4. User can type "My Matches" to see their matches
5. Matches are based on community votes for cute couples

**Ready to deploy! 🎉**