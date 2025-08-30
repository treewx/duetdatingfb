# 💕 Duet - Facebook Messenger Dating Bot

A simple dating app that runs as a Facebook Messenger chatbot where users rate couples and find matches based on community votes.

## 🚀 Features

- **Profile Setup**: Users create profiles with gender, preference, photo, and bio
- **Couple Rating**: Rate random couples as "cute" or not
- **Smart Matching**: Find matches based on who the community thinks you'd be cute with
- **Simple Interface**: Everything happens through Facebook Messenger

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **Facebook Developer Account**
3. **Facebook Page** (to connect the bot to)

## 🛠️ Setup Instructions

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd duetfacebook
npm install
```

### Step 2: Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Choose "Business" type
3. Add **Messenger** product to your app
4. Create a Facebook Page (if you don't have one)
5. In Messenger settings:
   - Generate a **Page Access Token** (save this)
   - Add webhook URL: `https://your-domain.com/webhook`
   - Add webhook verify token: `duet_verify_token_123` (or your custom token)
   - Subscribe to these webhook events:
     - `messages`
     - `messaging_postbacks`

### Step 3: Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your `.env` file:
```env
PAGE_ACCESS_TOKEN=your_page_access_token_from_facebook
APP_SECRET=your_app_secret_from_facebook
VERIFY_TOKEN=duet_verify_token_123
WEBHOOK_URL=https://your-deployed-app.com
PORT=3000
```

### Step 4: Test Locally (Optional)

1. Install ngrok for local testing:
```bash
npm install -g ngrok
```

2. Run the app locally:
```bash
npm run dev
```

3. In another terminal, expose your local server:
```bash
ngrok http 3000
```

4. Use the ngrok HTTPS URL as your webhook URL in Facebook

## 🌐 Deployment Options

### Deploy to Heroku

1. Install Heroku CLI
2. Create a new Heroku app:
```bash
heroku create your-app-name
```

3. Set environment variables:
```bash
heroku config:set PAGE_ACCESS_TOKEN=your_token
heroku config:set APP_SECRET=your_secret
heroku config:set VERIFY_TOKEN=duet_verify_token_123
```

4. Deploy:
```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

5. Your webhook URL will be: `https://your-app-name.herokuapp.com/webhook`

### Deploy to Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard
6. Your webhook URL will be: `https://your-app-name.onrender.com/webhook`

### Deploy to Railway

1. Connect to [Railway](https://railway.app)
2. Deploy from GitHub
3. Add environment variables
4. Your webhook URL will be provided by Railway

## 🔧 Facebook Webhook Setup

1. Go to your Facebook App → Messenger → Webhooks
2. Click "Add Callback URL"
3. Enter: `https://your-deployed-app.com/webhook`
4. Enter verify token: `duet_verify_token_123` (or your custom token)
5. Subscribe to: `messages` and `messaging_postbacks`
6. Click "Verify and Save"

## 💬 Testing Your Bot

1. Go to your Facebook Page
2. Send a message to start the conversation
3. The bot should respond with profile setup prompts
4. Complete your profile and start rating couples!

## 📱 User Flow

1. **First Time**: User messages the page → Profile setup (gender, preference, photo, bio)
2. **Rate Couples**: Type "View Couples" → See random couple → Rate as cute/not cute
3. **Find Matches**: Type "My Matches" → See people you match with based on community votes

## 🗄️ Database Schema

The app uses SQLite with these tables:

- **users**: Profile data (gender, preference, photo, bio)
- **ratings**: Couple ratings from users
- **user_states**: Chat flow state management

## 📊 API Endpoints

- `GET /webhook` - Facebook webhook verification
- `POST /webhook` - Facebook webhook events
- `GET /health` - Health check
- `GET /` - App info

## 🛡️ Security Features

- Webhook signature verification
- SQL injection protection
- Environment variable configuration

## 🔍 Troubleshooting

### Bot not responding?
1. Check if webhook URL is accessible: `https://your-app.com/health`
2. Verify Facebook webhook subscription is active
3. Check server logs for errors

### Profile setup stuck?
1. Type "help" to reset
2. Check if all webhook events are subscribed

### No couples showing?
1. Need at least 2 complete profiles in database
2. Invite more users to create profiles

## 🔄 Commands

- `View Couples` / `couples` - Start rating couples
- `My Matches` / `matches` - See your matches
- `Help` - Show help menu

## 📝 Development

```bash
# Run in development mode
npm run dev

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your own projects!

---

**Happy Dating! 💕**