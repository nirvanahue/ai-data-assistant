"use client";
import React, { useState, useRef } from "react";

export default function HomePage() {
  const [mode, setMode] = useState<'sql' | 'code'>('sql');
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("Your generated code will appear here...");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  // Use a generic type for recognitionRef to avoid referencing window.SpeechRecognition
  const recognitionRef = useRef<unknown>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Voice recognition logic
  const initSpeechRecognition = () => {
    if (typeof window === "undefined") {
      setVoiceStatus("❌ Speech recognition not supported in this browser");
      return null;
    }
    // Only use the local win object for SpeechRecognition
    const win = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    if (!('SpeechRecognition' in win || 'webkitSpeechRecognition' in win)) {
      setVoiceStatus("❌ Speech recognition not supported in this browser");
      return null;
    }
    if (!recognitionRef.current) {
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setVoiceStatus("❌ Speech recognition not supported in this browser");
        return null;
      }
      const recognition = new SpeechRecognitionClass();
      (recognition as { continuous: boolean }).continuous = false;
      (recognition as { interimResults: boolean }).interimResults = false;
      (recognition as { lang: string }).lang = "en-US";
      (recognition as { onstart: () => void }).onstart = () => setVoiceStatus('<span class="wave-animation">🎙️</span> Listening...');
      (recognition as { onresult: (event: unknown) => void }).onresult = (event: unknown) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'results' in event &&
          Array.isArray((event as { [key: string]: unknown }).results)
        ) {
          const results = (event as { [key: string]: unknown }).results as unknown[];
          if (
            results[0] &&
            Array.isArray(results[0]) &&
            (results[0] as { [key: string]: unknown }[])[0] &&
            typeof (results[0] as { [key: string]: unknown }[])[0].transcript === 'string'
          ) {
            const transcript = (results[0] as { [key: string]: unknown }[])[0].transcript as string;
            setInput(transcript);
            setVoiceStatus(`✅ Voice captured: &quot;${transcript}&quot;`);
          }
        }
      };
      (recognition as { onerror: (event: unknown) => void }).onerror = (_event: unknown) => setVoiceStatus("❌ Error occurred during recognition");
      (recognition as { onend: () => void }).onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
    return recognitionRef.current;
  };

  const toggleVoiceRecording = () => {
    const recognition = initSpeechRecognition();
    if (!recognition) return;
    if (isRecording) {
      (recognition as { stop: () => void }).stop();
      setIsRecording(false);
    } else {
      (recognition as { start: () => void }).start();
      setIsRecording(true);
    }
  };

  // Mode switching
  const switchMode = (newMode: 'sql' | 'code') => {
    setMode(newMode);
    setOutput("Your generated code will appear here...");
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (outputRef.current) {
      const text = outputRef.current.innerText;
      navigator.clipboard.writeText(text);
    }
  };

  // Example click (renamed from useExample)
  const handleExample = (example: string) => {
    setInput(example);
    setOutput("Your generated code will appear here...");
  };

  // Convert query
  const convertQuery = async () => {
    if (!input.trim()) {
      setOutput("Please enter a natural language query or use the microphone.");
      return;
    }
    setLoading(true);
    setOutput("");
    if (mode === "sql") {
      try {
        const res = await fetch("/api/nl-to-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        });
        const data = await res.json();
        setOutput(data.sql || "No SQL generated.");
      } catch {
        setOutput("Error generating SQL.");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/nl-to-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        });
        const data = await res.json();
        setOutput(data.code || "No code generated.");
      } catch {
        setOutput("Error generating code.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🤖 AI Data Assistant</h1>
        <p className="subtitle">Voice-Powered Natural Language to SQL & Code Generator</p>
        <div className="feature-badges">
          <div className="badge">🎤 Voice Recognition</div>
          <div className="badge">🔄 SQL Generation</div>
          <div className="badge">📊 Data Analysis Code</div>
          <div className="badge">🚀 AI-Powered</div>
        </div>
      </div>
      <div className="main-controls">
        <button className={`mode-toggle${mode === 'sql' ? ' active' : ''}`} onClick={() => switchMode('sql')} id="sqlMode">🗄️ SQL Generator</button>
        <button className={`mode-toggle${mode === 'code' ? ' active' : ''}`} onClick={() => switchMode('code')} id="codeMode">📊 Data Analysis Code</button>
      </div>
      <div className="schema-section">
        <h3 className="section-title"><span className="section-icon">🗂️</span>Sample Database Schema</h3>
        <div className="schema-table">
          <h4>👥 users</h4>
          <div className="schema-columns">
            <div className="schema-column">id (INT)</div>
            <div className="schema-column">name (VARCHAR)</div>
            <div className="schema-column">email (VARCHAR)</div>
            <div className="schema-column">age (INT)</div>
            <div className="schema-column">created_at (DATETIME)</div>
          </div>
        </div>
        <div className="schema-table">
          <h4>🛒 orders</h4>
          <div className="schema-columns">
            <div className="schema-column">id (INT)</div>
            <div className="schema-column">user_id (INT)</div>
            <div className="schema-column">product_name (VARCHAR)</div>
            <div className="schema-column">amount (DECIMAL)</div>
            <div className="schema-column">order_date (DATETIME)</div>
          </div>
        </div>
        <div className="schema-table">
          <h4>📦 products</h4>
          <div className="schema-columns">
            <div className="schema-column">id (INT)</div>
            <div className="schema-column">name (VARCHAR)</div>
            <div className="schema-column">price (DECIMAL)</div>
            <div className="schema-column">category (VARCHAR)</div>
            <div className="schema-column">stock (INT)</div>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="input-section">
          <h3 className="section-title"><span className="section-icon">🎯</span>Natural Language Input</h3>
          <textarea
            className="input-area"
            id="nlInput"
            placeholder={`Type or speak your question in plain English...\n\n🎤 Click the microphone to speak\n💬 Or type examples like:\n- Show me all users who are older than 25\n- Create a bar chart of sales by category\n- Find the average order amount\n- Generate a correlation matrix`}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="voice-controls">
            <button
              className={`voice-btn${isRecording ? ' recording' : ''}`}
              id="voiceBtn"
              type="button"
              onClick={toggleVoiceRecording}
            >
              <span id="voiceIcon">{isRecording ? "🔴" : "🎤"}</span>
              <span id="voiceText">{isRecording ? "Stop Recording" : "Start Recording"}</span>
            </button>
            <div className="voice-status" id="voiceStatus" dangerouslySetInnerHTML={{ __html: voiceStatus }} />
          </div>
          <button className="convert-btn" id="convertBtn" type="button" onClick={convertQuery} disabled={loading}>
            <span id="convertText">{mode === 'sql' ? "🚀 Generate SQL" : "🔬 Generate Code"}</span>
          </button>
          <div className="loading" id="loading" style={{ display: loading ? 'block' : 'none' }}>
            <div className="spinner"></div>
            <p>Processing your request...</p>
          </div>
        </div>
        <div className="output-section">
          <h3 className="section-title">
            <span className="section-icon" id="outputIcon">{mode === 'sql' ? "🗄️" : "📊"}</span>
            <span id="outputTitle">{mode === 'sql' ? "Generated SQL Query" : "Generated Analysis Code"}</span>
          </h3>
          <div className="output-area" id="output" ref={outputRef}>
            <button className="copy-btn" type="button" onClick={copyToClipboard}>📋 Copy</button>
            <div id="outputContent">{output}</div>
          </div>
        </div>
      </div>
      <div className="examples-section">
        <h3 className="section-title"><span className="section-icon">💡</span>Example Queries (Click to Try!)</h3>
        <div id="sqlExamples" style={{ display: mode === 'sql' ? 'block' : 'none' }}>
          <div className="example-item" onClick={() => handleExample('Show me all users who are older than 25')}>
            <div className="example-nl">💬 &quot;Show me all users who are older than 25&quot;</div>
            <div className="example-sql">{"SELECT * FROM users WHERE age > 25;"}</div>
          </div>
          <div className="example-item" onClick={() => handleExample('Find the total sales amount for each product category')}>
            <div className="example-nl">💬 &quot;Find the total sales amount for each product category&quot;</div>
            <div className="example-sql">{`SELECT p.category, SUM(o.amount) as total_sales\nFROM orders o\nJOIN products p ON o.product_name = p.name\nGROUP BY p.category;`}</div>
          </div>
          <div className="example-item" onClick={() => handleExample('Get the top 5 customers by total order amount')}>
            <div className="example-nl">💬 &quot;Get the top 5 customers by total order amount&quot;</div>
            <div className="example-sql">{`SELECT u.name, SUM(o.amount) as total_spent\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nORDER BY total_spent DESC\nLIMIT 5;`}</div>
          </div>
        </div>
        <div id="codeExamples" style={{ display: mode === 'code' ? 'block' : 'none' }}>
          <div className="example-item" onClick={() => handleExample('Create a bar chart showing sales by category')}>
            <div className="example-nl">📊 &quot;Create a bar chart showing sales by category&quot;</div>
            <div className="example-sql">{`import matplotlib.pyplot as plt\nimport pandas as pd\n\n# Sample data visualization\ndf.groupby('category')['amount'].sum().plot(kind='bar')\nplt.title('Sales by Category')\nplt.show()`}</div>
          </div>
          <div className="example-item" onClick={() => handleExample('Generate a correlation matrix for numerical data')}>
            <div className="example-nl">📊 &quot;Generate a correlation matrix for numerical data&quot;</div>
            <div className="example-sql">{`import seaborn as sns\nimport pandas as pd\n\n# Create correlation matrix\ncorr_matrix = df.corr()\nsns.heatmap(corr_matrix, annot=True, cmap='coolwarm')\nplt.title('Correlation Matrix')\nplt.show()`}</div>
          </div>
          <div className="example-item" onClick={() => handleExample('Show age distribution of users')}>
            <div className="example-nl">📊 &quot;Show age distribution of users&quot;</div>
            <div className="example-sql">{`import matplotlib.pyplot as plt\nimport pandas as pd\n\n# Age distribution histogram\nplt.hist(df['age'], bins=20, alpha=0.7, color='skyblue')\nplt.title('Age Distribution')\nplt.xlabel('Age')\nplt.ylabel('Frequency')\nplt.show()`}</div>
          </div>
        </div>
      </div>
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; overflow-x: hidden; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; color: white; position: relative; }
        .header h1 { font-size: 3.5rem; font-weight: 700; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); background: linear-gradient(45deg, #fff, #e0e7ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .header .subtitle { font-size: 1.3rem; opacity: 0.9; margin-bottom: 20px; }
        .feature-badges { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 20px; }
        .badge { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; border: 1px solid rgba(255, 255, 255, 0.3); animation: float 3s ease-in-out infinite; }
        .badge:nth-child(2) { animation-delay: 0.5s; }
        .badge:nth-child(3) { animation-delay: 1s; }
        .badge:nth-child(4) { animation-delay: 1.5s; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        .main-controls { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .mode-toggle { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: none; padding: 12px 24px; border-radius: 25px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .mode-toggle.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; transform: translateY(-2px); box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4); }
        .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .input-section, .output-section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); transition: all 0.3s ease; }
        .input-section:hover, .output-section:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
        .section-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; color: #4a5568; display: flex; align-items: center; gap: 10px; }
        .section-icon { font-size: 1.8rem; }
        .input-area { width: 100%; min-height: 120px; padding: 15px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; resize: vertical; transition: all 0.3s ease; font-family: inherit; }
        .input-area:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); transform: scale(1.02); }
        .voice-controls { display: flex; gap: 15px; margin-top: 15px; align-items: center; }
        .voice-btn { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; padding: 12px 20px; border-radius: 25px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .voice-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3); }
        .voice-btn.recording { background: linear-gradient(135deg, #ff4757 0%, #c44569 100%); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); } }
        .voice-status { color: #667eea; font-weight: 500; display: flex; align-items: center; gap: 5px; }
        .convert-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 20px; width: 100%; }
        .convert-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        .convert-btn:active { transform: translateY(0); }
        .output-area { background: #1a202c; color: #e2e8f0; padding: 20px; border-radius: 12px; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.9rem; line-height: 1.5; min-height: 200px; overflow-x: auto; white-space: pre-wrap; position: relative; }
        .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.1); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; transition: all 0.3s ease; }
        .copy-btn:hover { background: rgba(255, 255, 255, 0.2); }
        .schema-section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); margin-bottom: 30px; }
        .schema-table { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; transition: all 0.3s ease; }
        .schema-table:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .schema-table h4 { color: #2d3748; margin-bottom: 10px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
        .schema-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
        .schema-column { background: white; padding: 8px 12px; border-radius: 8px; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.85rem; border: 1px solid #e2e8f0; transition: all 0.3s ease; }
        .schema-column:hover { border-color: #667eea; transform: translateY(-1px); }
        .examples-section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); }
        .example-item { margin-bottom: 20px; padding: 15px; background: #f7fafc; border-radius: 12px; border-left: 4px solid #667eea; cursor: pointer; transition: all 0.3s ease; }
        .example-item:hover { transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-left-color: #4299e1; }
        .example-nl { font-weight: 600; color: #4a5568; margin-bottom: 8px; }
        .example-sql { font-family: 'Monaco', 'Consolas', monospace; background: #2d3748; color: #e2e8f0; padding: 10px; border-radius: 8px; font-size: 0.85rem; }
        .loading { display: none; text-align: center; color: #667eea; margin-top: 20px; }
        .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .wave-animation { display: inline-block; animation: wave 1s ease-in-out infinite; }
        @keyframes wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
        .hidden { display: none !important; }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } .header h1 { font-size: 2.5rem; } .container { padding: 10px; } .voice-controls { flex-direction: column; align-items: stretch; } .feature-badges { flex-direction: column; align-items: center; } }
      `}</style>
    </div>
  );
}
