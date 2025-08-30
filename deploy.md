# 🚀 Quick Deploy Guide

## 1-Click Deploy Options

### Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Environment Variables Required

```env
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
APP_SECRET=your_facebook_app_secret  
VERIFY_TOKEN=duet_verify_token_123
```

## After Deployment

1. Note your webhook URL: `https://your-app.herokuapp.com/webhook`
2. Add this URL to Facebook Messenger webhook settings
3. Subscribe to `messages` and `messaging_postbacks` events
4. Test by messaging your Facebook page

## Quick Test Commands

```bash
# Test health endpoint
curl https://your-app.herokuapp.com/health

# Test webhook verification (should return challenge)
curl "https://your-app.herokuapp.com/webhook?hub.mode=subscribe&hub.verify_token=duet_verify_token_123&hub.challenge=test123"
```

Done! 🎉