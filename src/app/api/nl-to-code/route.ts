import { NextRequest, NextResponse } from "next/server";

// Google Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAXYYcN4qoBjS8heTGpitKAb7lY2iejvu0";

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: "Invalid question provided" },
        { status: 400 }
      );
    }

    // If you have Gemini API configured, use it
    if (GEMINI_API_KEY) {
      return await generateCodeWithGemini(question);
    }

    // Fallback to intelligent code generation based on keywords
    const code = generateCodeFromKeywords(question);
    return NextResponse.json({ code });

  } catch (error) {
    console.error("Code generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis code" },
      { status: 500 }
    );
  }
}

async function generateCodeWithGemini(question: string) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a Python data analysis expert. Generate only Python code using pandas, matplotlib, seaborn, numpy.
Include proper imports and complete, runnable code. Focus on data visualization and analysis.
Assume you have a DataFrame called 'df' with common columns like: age, income, category, amount, date, etc.

Generate Python code for: ${question}

Return only the Python code without any explanations or markdown formatting.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const code = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!code) {
      throw new Error("No code generated from Gemini API");
    }

    return NextResponse.json({ code });

  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback to keyword-based generation
    const code = generateCodeFromKeywords(question);
    return NextResponse.json({ code });
  }
}

function generateCodeFromKeywords(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // Bar chart queries
  if (lowerQuestion.includes("bar") && lowerQuestion.includes("chart")) {
    if (lowerQuestion.includes("sales") && lowerQuestion.includes("category")) {
      return `import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style for better looking charts
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Sample data - replace with your actual data
data = {
    'category': ['Electronics', 'Clothing', 'Books', 'Food', 'Sports'],
    'sales': [12500, 8900, 3200, 5600, 4100]
}
df = pd.DataFrame(data)

# Create bar chart
plt.figure(figsize=(10, 6))
bars = plt.bar(df['category'], df['sales'], color='#667eea', alpha=0.8)

# Customize the chart
plt.title('Sales by Category', fontsize=16, fontweight='bold', pad=20)
plt.xlabel('Category', fontsize=12)
plt.ylabel('Sales ($)', fontsize=12)

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 100,
             '$' + str(int(height)), ha='center', va='bottom', fontweight='bold')

# Rotate x-axis labels for better readability
plt.xticks(rotation=45, ha='right')

# Add grid for better readability
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.show()`;
    }
    
    return `import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style for better looking charts
plt.style.use('seaborn-v0_8')

# Create bar chart
plt.figure(figsize=(10, 6))
df.groupby('category')['amount'].sum().plot(kind='bar', color='#667eea', alpha=0.8)

plt.title('Bar Chart Analysis', fontsize=16, fontweight='bold')
plt.xlabel('Category')
plt.ylabel('Amount')
plt.xticks(rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`;
  }
  
  // Histogram queries
  if (lowerQuestion.includes("histogram") || 
      (lowerQuestion.includes("age") && lowerQuestion.includes("distribution"))) {
    return `import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style for better looking charts
plt.style.use('seaborn-v0_8')

# Create histogram
plt.figure(figsize=(10, 6))
plt.hist(df['age'], bins=20, alpha=0.7, color='#764ba2', edgecolor='black')

plt.title('Age Distribution', fontsize=16, fontweight='bold')
plt.xlabel('Age')
plt.ylabel('Frequency')
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.show()`;
  }
  
  // Correlation matrix queries
  if (lowerQuestion.includes("correlation") || 
      lowerQuestion.includes("correlation matrix") ||
      lowerQuestion.includes("numerical data")) {
    return `import seaborn as sns
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Set style for better looking charts
plt.style.use('seaborn-v0_8')

# Select numerical columns for correlation
numerical_cols = df.select_dtypes(include=[np.number]).columns

# Create correlation matrix
corr_matrix = df[numerical_cols].corr()

# Create heatmap
plt.figure(figsize=(10, 8))
mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
sns.heatmap(corr_matrix, 
            mask=mask,
            annot=True, 
            cmap='coolwarm', 
            center=0,
            square=True,
            fmt='.2f',
            cbar_kws={"shrink": .8})

plt.title('Correlation Matrix', fontsize=16, fontweight='bold', pad=20)
plt.tight_layout()
plt.show()`;
  }
  
  // Scatter plot queries
  if (lowerQuestion.includes("scatter") || lowerQuestion.includes("relationship")) {
    return `import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style for better looking charts
plt.style.use('seaborn-v0_8')

# Create scatter plot
plt.figure(figsize=(10, 6))
plt.scatter(df['age'], df['income'], alpha=0.6, color='#667eea', s=50)

plt.title('Age vs Income Relationship', fontsize=16, fontweight='bold')
plt.xlabel('Age')
plt.ylabel('Income')
plt.grid(alpha=0.3)
plt.tight_layout()
plt.show()`;
  }
  
  // Default analysis code
  return `# Python code for: ${question}
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set style for better looking charts
plt.style.use('seaborn-v0_8')

# Basic data analysis
print("Dataset shape:", df.shape)
print("\\nFirst few rows:")
print(df.head())

print("\\nData types:")
print(df.dtypes)

print("\\nSummary statistics:")
print(df.describe())

# Create a simple visualization
plt.figure(figsize=(10, 6))
df.hist(figsize=(12, 8))
plt.suptitle('Data Distribution Overview', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()`;
} 