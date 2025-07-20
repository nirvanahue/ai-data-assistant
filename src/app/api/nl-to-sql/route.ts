import { NextRequest, NextResponse } from "next/server";

// You can replace this with your preferred AI service
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://api.openai.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: "Invalid question provided" },
        { status: 400 }
      );
    }

    // If you have an AI service configured, use it
    if (AI_API_KEY && AI_SERVICE_URL) {
      return await generateSQLWithAI(question);
    }

    // Fallback to intelligent SQL generation based on keywords
    const sql = generateSQLFromKeywords(question);
    return NextResponse.json({ sql });

  } catch (error) {
    console.error("SQL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate SQL query" },
      { status: 500 }
    );
  }
}

async function generateSQLWithAI(question: string) {
  try {
    const response = await fetch(AI_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a SQL expert. Generate only SQL queries without explanations. 
            Use standard SQL syntax. Assume common table names like: users, orders, products, customers, sales.
            Common columns: id, name, email, created_at, amount, category, user_id, product_id, etc.`
          },
          {
            role: "user",
            content: `Convert this to SQL: ${question}`
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const sql = data.choices?.[0]?.message?.content?.trim();
    
    if (!sql) {
      throw new Error("No SQL generated from AI service");
    }

    return NextResponse.json({ sql });

  } catch (error) {
    console.error("AI service error:", error);
    // Fallback to keyword-based generation
    const sql = generateSQLFromKeywords(question);
    return NextResponse.json({ sql });
  }
}

function generateSQLFromKeywords(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // User queries
  if (lowerQuestion.includes("user") && lowerQuestion.includes("older")) {
    const age = extractNumber(question) || 25;
    return `SELECT * FROM users WHERE age > ${age};`;
  }
  
  if (lowerQuestion.includes("user") && lowerQuestion.includes("email")) {
    return `SELECT id, name, email FROM users ORDER BY created_at DESC;`;
  }
  
  // Sales queries
  if (lowerQuestion.includes("sales") && lowerQuestion.includes("total")) {
    return `SELECT category, SUM(amount) as total_sales 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            GROUP BY category 
            ORDER BY total_sales DESC;`;
  }
  
  if (lowerQuestion.includes("sales") && lowerQuestion.includes("category")) {
    return `SELECT p.category, COUNT(*) as order_count, SUM(o.amount) as total_revenue 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            GROUP BY p.category;`;
  }
  
  // Customer queries
  if (lowerQuestion.includes("customer") && lowerQuestion.includes("top")) {
    const limit = extractNumber(question) || 5;
    return `SELECT c.name, COUNT(o.id) as order_count, SUM(o.amount) as total_spent 
            FROM customers c 
            JOIN orders o ON c.id = o.customer_id 
            GROUP BY c.id, c.name 
            ORDER BY total_spent DESC 
            LIMIT ${limit};`;
  }
  
  // Product queries
  if (lowerQuestion.includes("product") && lowerQuestion.includes("category")) {
    return `SELECT category, COUNT(*) as product_count, AVG(price) as avg_price 
            FROM products 
            GROUP BY category;`;
  }
  
  // Default query
  return `-- SQL for: ${question}
SELECT * FROM users 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;`;
}

function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : null;
} 