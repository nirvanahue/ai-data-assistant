# 🚀 SpeakQL Backend Setup Guide

## Overview
Your SpeakQL app now has a sophisticated backend that uses **Google Gemini API** for generating SQL queries and data analysis code, with intelligent fallback systems.

## 🔧 Setup Options

### Option 1: Google Gemini (Currently Configured) ✅
Your app is already configured with Gemini API! The API key is set up and ready to use.

**Features:**
- **AI-Powered SQL Generation**: Converts natural language to SQL using Gemini Pro
- **AI-Powered Code Generation**: Creates Python data analysis code with Gemini Pro
- **Smart Fallback**: Uses keyword-based generation if API fails
- **Professional Code**: Generates complete, runnable Python code

### Option 2: Custom Gemini API Key
If you want to use your own Gemini API key:
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env.local` file in your project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Option 3: No API Key (Fallback Mode)
- If no API key is provided, the app will use intelligent keyword-based generation
- This works immediately without any setup

## 🎯 Features

### SQL Generation with Gemini
- **AI-Powered**: Uses Gemini Pro for natural language to SQL conversion
- **Smart Fallback**: Keyword-based SQL generation for common queries
- **Error Handling**: Graceful fallback if API is unavailable
- **Professional Queries**: Generates proper SQL with JOINs, GROUP BY, etc.

### Data Analysis Code with Gemini
- **Complete Python Code**: Generates runnable pandas/matplotlib/seaborn code
- **Multiple Chart Types**: Bar charts, histograms, correlation matrices, scatter plots
- **Professional Styling**: Uses modern chart styling and best practices
- **Real Data Examples**: Includes sample data for immediate testing

### Supported Query Types

#### SQL Queries (Gemini + Fallback):
- "Show me all users who are older than 25"
- "Find the total sales amount for each product category"
- "Get the top 5 customers by total order amount"
- "Find users with email addresses"
- "Show me sales data from last month"

#### Data Analysis (Gemini + Fallback):
- "Create a bar chart showing sales by category"
- "Generate a correlation matrix for numerical data"
- "Show age distribution of users"
- "Create a scatter plot of age vs income"
- "Analyze customer spending patterns"

## 🔄 How It Works

1. **User Input**: Natural language query
2. **Gemini Processing**: Sends to Google Gemini Pro API
3. **Fallback**: If Gemini fails, uses keyword-based generation
4. **Response**: Returns formatted SQL or Python code
5. **Chart Detection**: Automatically detects chart types for visualization

## 🛠️ Testing

### Test SQL Generation:
```bash
curl -X POST http://localhost:3000/api/nl-to-sql \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all users who are older than 25"}'
```

### Test Code Generation:
```bash
curl -X POST http://localhost:3000/api/nl-to-code \
  -H "Content-Type: application/json" \
  -d '{"question": "Create a bar chart showing sales by category"}'
```

## 🔒 Security Notes

- The current Gemini API key is configured for development
- For production, use environment variables in your hosting platform
- Consider rate limiting for API calls
- Monitor API usage and costs

## 🚀 Deployment

### Vercel:
1. Add `GEMINI_API_KEY` environment variable in Vercel dashboard
2. Deploy automatically from GitHub

### Other Platforms:
1. Set `GEMINI_API_KEY` environment variable in your hosting platform
2. Ensure `.env.local` is in `.gitignore`

## 📊 Performance

- **Gemini Mode**: ~2-4 seconds response time
- **Fallback Mode**: ~100ms response time
- **Caching**: Consider implementing response caching for repeated queries

## 🎨 Customization

You can customize the Gemini prompts by editing:
- `src/app/api/nl-to-sql/route.ts` - SQL generation logic
- `src/app/api/nl-to-code/route.ts` - Code generation logic

## 🆘 Troubleshooting

### Common Issues:
1. **API Key Invalid**: Check your Gemini API key
2. **Rate Limits**: Gemini has generous rate limits
3. **Network Issues**: Check firewall and proxy settings
4. **CORS Errors**: Ensure proper CORS configuration

### Debug Mode:
Add `DEBUG=true` to your `.env.local` for detailed logging.

## 🌟 Gemini Advantages

- **Free Tier**: Generous free usage limits
- **High Quality**: Excellent code generation capabilities
- **Fast Response**: Quick API response times
- **Reliable**: Google's infrastructure
- **Multilingual**: Supports multiple programming languages

---

**Ready to go!** Your SpeakQL app is now powered by Google Gemini and will generate high-quality SQL queries and Python code! 🚀 