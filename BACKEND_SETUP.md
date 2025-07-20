# 🚀 SpeakQL Backend Setup Guide

## Overview
Your SpeakQL app now has a sophisticated backend that can connect to real AI services for generating SQL queries and data analysis code.

## 🔧 Setup Options

### Option 1: OpenAI (Recommended)
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Create a `.env.local` file in your project root:
```env
AI_SERVICE_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your_openai_api_key_here
```

### Option 2: Anthropic Claude
1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Create a `.env.local` file:
```env
AI_SERVICE_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=your_anthropic_api_key_here
```

### Option 3: Local AI (Ollama, etc.)
1. Set up a local AI service
2. Create a `.env.local` file:
```env
AI_SERVICE_URL=http://localhost:11434/v1/chat/completions
AI_API_KEY=your_local_api_key_here
```

### Option 4: No AI Service (Fallback Mode)
- If no API keys are provided, the app will use intelligent keyword-based generation
- This works immediately without any setup

## 🎯 Features

### SQL Generation
- **AI-Powered**: Uses GPT-3.5-turbo or similar for natural language to SQL
- **Smart Fallback**: Keyword-based SQL generation for common queries
- **Error Handling**: Graceful fallback if AI service is unavailable

### Data Analysis Code
- **Complete Python Code**: Generates runnable pandas/matplotlib/seaborn code
- **Multiple Chart Types**: Bar charts, histograms, correlation matrices, scatter plots
- **Professional Styling**: Uses modern chart styling and best practices

### Supported Query Types

#### SQL Queries:
- "Show me all users who are older than 25"
- "Find the total sales amount for each product category"
- "Get the top 5 customers by total order amount"
- "Find users with email addresses"

#### Data Analysis:
- "Create a bar chart showing sales by category"
- "Generate a correlation matrix for numerical data"
- "Show age distribution of users"
- "Create a scatter plot of age vs income"

## 🔄 How It Works

1. **User Input**: Natural language query
2. **AI Processing**: Sends to configured AI service
3. **Fallback**: If AI fails, uses keyword-based generation
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

- Never commit your `.env.local` file to version control
- Use environment variables for production deployments
- Consider rate limiting for AI API calls
- Monitor API usage and costs

## 🚀 Deployment

### Vercel:
1. Add environment variables in Vercel dashboard
2. Deploy automatically from GitHub

### Other Platforms:
1. Set environment variables in your hosting platform
2. Ensure `.env.local` is in `.gitignore`

## 📊 Performance

- **AI Mode**: ~2-5 seconds response time
- **Fallback Mode**: ~100ms response time
- **Caching**: Consider implementing response caching for repeated queries

## 🎨 Customization

You can customize the AI prompts by editing:
- `src/app/api/nl-to-sql/route.ts` - SQL generation logic
- `src/app/api/nl-to-code/route.ts` - Code generation logic

## 🆘 Troubleshooting

### Common Issues:
1. **API Key Invalid**: Check your API key and service URL
2. **Rate Limits**: Implement exponential backoff
3. **Network Issues**: Check firewall and proxy settings
4. **CORS Errors**: Ensure proper CORS configuration

### Debug Mode:
Add `DEBUG=true` to your `.env.local` for detailed logging.

---

**Ready to go!** Your SpeakQL app will work immediately with fallback mode, and you can add AI services anytime for enhanced capabilities. 