"use client";
import React, { useState, useRef } from "react";
import GraphBox from "../components/GraphBox";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
}

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
  const [chartType, setChartType] = useState<'bar' | 'histogram' | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [sharingEmail, setSharingEmail] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);

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
      (recognition as { onerror: (event: unknown) => void }).onerror = () => setVoiceStatus("❌ Error occurred during recognition");
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
    setChartType(null);
    setChartData(null);
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

  // Generate PDF Report
  const generatePDFReport = async () => {
    if (!input.trim() || output === "Your generated code will appear here...") {
      alert("Please generate some content first before creating a PDF report.");
      return;
    }

    setGeneratingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("🗣️ SpeakQL Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Add timestamp
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const timestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${timestamp}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Add query summary
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Query Summary:", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const queryLines = pdf.splitTextToSize(input, pageWidth - 2 * margin);
      pdf.text(queryLines, margin, yPosition);
      yPosition += queryLines.length * 7 + 15;

      // Add generated code
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${mode === 'sql' ? 'Generated SQL:' : 'Generated Analysis Code:'}`, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont("courier", "normal");
      const codeLines = pdf.splitTextToSize(output, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (yPosition + codeLines.length * 5 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(codeLines, margin, yPosition);

      // Add chart if available
      if (chartType && chartData) {
        yPosition += codeLines.length * 5 + 20;
        
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Chart Preview:", margin, yPosition);
        yPosition += 10;

        // Create a simple chart representation
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Chart Type: ${chartType}`, margin, yPosition);
        yPosition += 10;
        pdf.text(`Data Points: ${chartData.labels.length}`, margin, yPosition);
      }

      // Save the PDF
      pdf.save(`speakql-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Share via Email
  const shareViaEmail = async () => {
    if (!input.trim() || output === "Your generated code will appear here...") {
      alert("Please generate some content first before sharing via email.");
      return;
    }

    setSharingEmail(true);
    try {
      const subject = encodeURIComponent(`SpeakQL Analysis: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
      const body = encodeURIComponent(`
🗣️ SpeakQL Analysis Report

Query: ${input}

Generated ${mode === 'sql' ? 'SQL Query' : 'Analysis Code'}:
${output}

Generated on: ${new Date().toLocaleString()}
Powered by SpeakQL - Voice-Powered Data Analysis

---
This report was generated using SpeakQL's AI-powered natural language processing.
      `);
      
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');
      
      // Show success message
      setTimeout(() => {
        alert("Email client opened! The analysis has been prepared for sharing.");
      }, 500);
    } catch (error) {
      console.error("Error sharing via email:", error);
      alert("Error sharing via email. Please try again.");
    } finally {
      setSharingEmail(false);
    }
  };

  // Create Alert
  const createAlert = async () => {
    if (!input.trim() || output === "Your generated code will appear here...") {
      alert("Please generate some content first before creating an alert.");
      return;
    }

    setCreatingAlert(true);
    try {
      // Create alert content based on the analysis
      const alertContent = generateAlertContent(input, mode, output);
      
      // Create a temporary div for the alert card
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        width: 800px;
        height: 600px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 40px;
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: fixed;
        top: -9999px;
        left: -9999px;
        z-index: -1;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      `;

      alertDiv.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 80px; margin-bottom: 20px;">🚨</div>
          <h1 style="font-size: 36px; font-weight: bold; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Data Alert Generated</h1>
          <h2 style="font-size: 28px; font-weight: 600; margin: 0 0 15px 0; opacity: 0.9;">${alertContent.title}</h2>
          <p style="font-size: 18px; opacity: 0.8; margin: 0 0 30px 0; line-height: 1.5;">${alertContent.description}</p>
          
          <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">Alert Details:</h3>
            <div style="text-align: left; font-size: 16px; line-height: 1.6;">
              ${alertContent.details}
            </div>
          </div>
          
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px;">
            <div style="background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 10px;">
              <div style="font-size: 24px; font-weight: bold;">${alertContent.priority}</div>
              <div style="font-size: 14px; opacity: 0.8;">Priority Level</div>
            </div>
            <div style="background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 10px;">
              <div style="font-size: 24px; font-weight: bold;">${alertContent.action}</div>
              <div style="font-size: 14px; opacity: 0.8;">Recommended Action</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 14px; opacity: 0.7; margin-top: 20px;">
          Generated on ${new Date().toLocaleString()} | 🗣️ Powered by SpeakQL
        </div>
      `;

      document.body.appendChild(alertDiv);

      // Convert to canvas and download
      const canvas = await html2canvas(alertDiv, {
        width: 800,
        height: 600,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `speakql-alert-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      // Clean up
      document.body.removeChild(alertDiv);
      
      // Show success message
      setTimeout(() => {
        alert("Alert generated successfully! Check your downloads for the alert image.");
      }, 500);
    } catch (error) {
      console.error("Error creating alert:", error);
      alert("Error creating alert. Please try again.");
    } finally {
      setCreatingAlert(false);
    }
  };

  // Helper function to generate alert content
  const generateAlertContent = (query: string, currentMode: 'sql' | 'code', output: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (currentMode === 'sql') {
      if (lowerQuery.includes('sales') && lowerQuery.includes('total')) {
        return {
          title: "📈 Sales Performance Alert",
          description: "Critical sales analysis reveals important business metrics that require attention",
          priority: "High",
          action: "Review",
          details: `
            • Sales data analysis completed<br>
            • Revenue metrics identified<br>
            • Performance trends detected<br>
            • Growth opportunities highlighted<br>
            • SQL query: ${output.substring(0, 100)}...
          `
        };
      } else if (lowerQuery.includes('user') && lowerQuery.includes('age')) {
        return {
          title: "👥 User Demographics Alert",
          description: "User age distribution analysis shows important demographic patterns",
          priority: "Medium",
          action: "Monitor",
          details: `
            • User demographics analyzed<br>
            • Age distribution patterns identified<br>
            • Customer segmentation insights<br>
            • Target audience data available<br>
            • SQL query: ${output.substring(0, 100)}...
          `
        };
      } else if (lowerQuery.includes('customer') && lowerQuery.includes('top')) {
        return {
          title: "🏆 VIP Customer Alert",
          description: "Top customer analysis reveals high-value customer segments",
          priority: "High",
          action: "Act",
          details: `
            • VIP customers identified<br>
            • Revenue contribution analyzed<br>
            • Loyalty patterns detected<br>
            • Retention opportunities found<br>
            • SQL query: ${output.substring(0, 100)}...
          `
        };
      } else {
        return {
          title: "🔍 Data Query Alert",
          description: "SQL query execution completed with important data insights",
          priority: "Medium",
          action: "Review",
          details: `
            • Database query executed<br>
            • Data insights generated<br>
            • Results available for analysis<br>
            • Business intelligence enhanced<br>
            • SQL query: ${output.substring(0, 100)}...
          `
        };
      }
    } else {
      if (lowerQuery.includes('bar') && lowerQuery.includes('chart')) {
        return {
          title: "📊 Visualization Alert",
          description: "Bar chart visualization created for data presentation",
          priority: "Low",
          action: "Share",
          details: `
            • Bar chart visualization generated<br>
            • Data patterns visualized<br>
            • Presentation-ready graphics<br>
            • Insights clearly displayed<br>
            • Python code: ${output.substring(0, 100)}...
          `
        };
      } else if (lowerQuery.includes('correlation') || lowerQuery.includes('matrix')) {
        return {
          title: "🔗 Correlation Alert",
          description: "Correlation analysis reveals important variable relationships",
          priority: "Medium",
          action: "Analyze",
          details: `
            • Correlation matrix generated<br>
            • Variable relationships identified<br>
            • Statistical insights available<br>
            • Data patterns discovered<br>
            • Python code: ${output.substring(0, 100)}...
          `
        };
      } else if (lowerQuery.includes('distribution') || lowerQuery.includes('histogram')) {
        return {
          title: "📈 Distribution Alert",
          description: "Distribution analysis shows data spread and patterns",
          priority: "Medium",
          action: "Review",
          details: `
            • Distribution analysis completed<br>
            • Data spread patterns identified<br>
            • Statistical insights generated<br>
            • Outliers detected<br>
            • Python code: ${output.substring(0, 100)}...
          `
        };
      } else {
        return {
          title: "🔬 Analysis Alert",
          description: "Data analysis code generated for business intelligence",
          priority: "Low",
          action: "Execute",
          details: `
            • Analysis code generated<br>
            • Data processing ready<br>
            • Insights available<br>
            • Business intelligence enhanced<br>
            • Python code: ${output.substring(0, 100)}...
          `
        };
      }
    }
  };

  // Generate Insight Post
  const generateInsightPost = async () => {
    if (!input.trim() || output === "Your generated code will appear here...") {
      alert("Please generate some content first before creating an insight post.");
      return;
    }

    setGeneratingInsight(true);
    try {
      // Generate dynamic content based on input
      const { title, subtitle, emoji, gradient, stats, hashtags } = generateDynamicContent(input, mode);
      
      // Create a temporary div for the social card
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `
        width: 1200px;
        height: 630px;
        background: ${gradient};
        color: white;
        padding: 40px;
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: fixed;
        top: -9999px;
        left: -9999px;
        z-index: -1;
        overflow: hidden;
      `;

      // Add animated background elements
      const backgroundElements = `
        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
        <div style="position: absolute; top: 50%; left: 10%; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
      `;
      
      cardDiv.innerHTML = `
        ${backgroundElements}
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
          <div>
            <h1 style="font-size: 48px; font-weight: bold; margin: 0; line-height: 1.2; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🗣️ SpeakQL</h1>
            <p style="font-size: 20px; margin: 8px 0 0 0; opacity: 0.9; font-weight: 500;">Voice-Powered Data Analysis</p>
          </div>
          <div style="text-align: right; font-size: 16px; opacity: 0.8; font-weight: 500;">
            ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        
        <div style="text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 2;">
          <div style="font-size: 80px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${emoji}</div>
          <h2 style="font-size: 42px; font-weight: bold; margin: 0 0 15px 0; line-height: 1.2; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${title}</h2>
          <p style="font-size: 24px; opacity: 0.9; margin: 0 0 30px 0; font-weight: 500; line-height: 1.4;">${subtitle}</p>
          
          ${stats ? `
          <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
            ${stats.map(stat => `
              <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${stat.value}</div>
                <div style="font-size: 14px; opacity: 0.8;">${stat.label}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
          <div style="font-size: 16px; opacity: 0.8; font-weight: 500;">
            📊 ${mode === 'sql' ? 'SQL Query Generated' : 'Data Analysis Code Generated'}
          </div>
          <div style="font-size: 16px; opacity: 0.8; font-weight: 500;">
            🚀 Powered by SpeakQL
          </div>
        </div>
        
        ${hashtags ? `
        <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 14px; opacity: 0.7; font-weight: 500;">
          ${hashtags}
        </div>
        ` : ''}
      `;

      document.body.appendChild(cardDiv);

      // Convert to canvas and download
      const canvas = await html2canvas(cardDiv, {
        width: 1200,
        height: 630,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `speakql-insight-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      // Clean up
      document.body.removeChild(cardDiv);
    } catch (error) {
      console.error("Error generating insight post:", error);
      alert("Error generating insight post. Please try again.");
    } finally {
      setGeneratingInsight(false);
    }
  };

  // Helper function to generate dynamic content
  const generateDynamicContent = (query: string, currentMode: 'sql' | 'code') => {
    const lowerQuery = query.toLowerCase();
    
    // Define different gradients for variety
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    if (currentMode === 'sql') {
      if (lowerQuery.includes('sales') && lowerQuery.includes('total')) {
        return {
          title: "💰 Revenue Insights Unlocked",
          subtitle: "Total sales analysis reveals key performance metrics and growth opportunities",
          emoji: "📈",
          gradient: randomGradient,
          stats: [
            { value: "125K", label: "Total Sales" },
            { value: "23%", label: "Growth" },
            { value: "15", label: "Categories" }
          ],
          hashtags: "#DataAnalytics #SalesInsights #BusinessIntelligence #RevenueGrowth"
        };
      } else if (lowerQuery.includes('user') && lowerQuery.includes('age')) {
        return {
          title: "👥 Demographic Discovery",
          subtitle: "User age distribution analysis provides valuable customer insights",
          emoji: "🎯",
          gradient: randomGradient,
          stats: [
            { value: "2.4K", label: "Users Analyzed" },
            { value: "26-35", label: "Peak Age" },
            { value: "78%", label: "Active Users" }
          ],
          hashtags: "#UserAnalytics #Demographics #CustomerInsights #DataScience"
        };
      } else if (lowerQuery.includes('customer') && lowerQuery.includes('top')) {
        return {
          title: "🏆 VIP Customer Analysis",
          subtitle: "Top customer identification reveals loyalty patterns and revenue drivers",
          emoji: "💎",
          gradient: randomGradient,
          stats: [
            { value: "Top 5", label: "VIP Customers" },
            { value: "45K", label: "Total Spent" },
            { value: "92%", label: "Retention" }
          ],
          hashtags: "#CustomerAnalytics #VIPAnalysis #LoyaltyProgram #BusinessGrowth"
        };
      } else if (lowerQuery.includes('product') && lowerQuery.includes('category')) {
        return {
          title: "📦 Product Performance",
          subtitle: "Category analysis reveals top-performing products and market trends",
          emoji: "🚀",
          gradient: randomGradient,
          stats: [
            { value: "15", label: "Categories" },
            { value: "Electronics", label: "Top Category" },
            { value: "12.5K", label: "Sales Volume" }
          ],
          hashtags: "#ProductAnalytics #CategoryAnalysis #MarketTrends #PerformanceMetrics"
        };
      } else {
        return {
          title: "🔍 Data Query Executed",
          subtitle: "SQL-powered insights reveal hidden patterns in your business data",
          emoji: "⚡",
          gradient: randomGradient,
          stats: [
            { value: "100%", label: "Accuracy" },
            { value: "<2s", label: "Query Time" },
            { value: "AI", label: "Powered" }
          ],
          hashtags: "#SQL #DataAnalytics #BusinessIntelligence #AI"
        };
      }
    } else {
      if (lowerQuery.includes('bar') && lowerQuery.includes('chart')) {
        return {
          title: "📊 Visual Data Story",
          subtitle: "Bar chart visualization transforms complex data into actionable insights",
          emoji: "🎨",
          gradient: randomGradient,
          stats: [
            { value: "5", label: "Data Points" },
            { value: "100%", label: "Clarity" },
            { value: "Instant", label: "Insights" }
          ],
          hashtags: "#DataVisualization #BarCharts #Analytics #Insights"
        };
      } else if (lowerQuery.includes('correlation') || lowerQuery.includes('matrix')) {
        return {
          title: "🔗 Correlation Matrix",
          subtitle: "Relationship analysis reveals hidden connections between variables",
          emoji: "🧠",
          gradient: randomGradient,
          stats: [
            { value: "0.91", label: "Max Correlation" },
            { value: "5", label: "Variables" },
            { value: "Strong", label: "Relationships" }
          ],
          hashtags: "#CorrelationAnalysis #DataScience #StatisticalInsights #Relationships"
        };
      } else if (lowerQuery.includes('distribution') || lowerQuery.includes('histogram')) {
        return {
          title: "📈 Distribution Analysis",
          subtitle: "Statistical distribution reveals patterns and outliers in your data",
          emoji: "📊",
          gradient: randomGradient,
          stats: [
            { value: "6", label: "Bins" },
            { value: "Normal", label: "Distribution" },
            { value: "78", label: "Peak Value" }
          ],
          hashtags: "#DistributionAnalysis #Statistics #DataPatterns #Analytics"
        };
      } else {
        return {
          title: "🔬 Data Analysis Complete",
          subtitle: "AI-generated code provides powerful insights and visualizations",
          emoji: "✨",
          gradient: randomGradient,
          stats: [
            { value: "Python", label: "Code Generated" },
            { value: "100%", label: "Accuracy" },
            { value: "AI", label: "Powered" }
          ],
          hashtags: "#DataAnalysis #Python #AI #MachineLearning"
        };
      }
    }
  };

  // Convert query
  const convertQuery = async () => {
    if (!input.trim()) {
      setOutput("Please enter a natural language query or use the microphone.");
      setChartType(null);
      setChartData(null);
      return;
    }
    setLoading(true);
    setOutput("");
    // Do not reset chartType/chartData here, only after successful fetch
    if (mode === "sql") {
      try {
        const res = await fetch("/api/nl-to-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input }),
        });
        const data = await res.json();
        setOutput(data.sql || "No SQL generated.");
        setChartType(null);
        setChartData(null);
      } catch {
        setOutput("Error generating SQL.");
        setChartType(null);
        setChartData(null);
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
        // Detect chart type and set sample data
        const lower = input.toLowerCase();
        
        // Bar chart detection
        if (lower.includes("bar") && lower.includes("chart") || 
            lower.includes("bar chart") || 
            lower.includes("sales by category")) {
          setChartType("bar");
          setChartData({
            labels: ["Electronics", "Clothing", "Books", "Food", "Sports"],
            datasets: [
              { label: "Sales", data: [12500, 8900, 3200, 5600, 4100], backgroundColor: "#667eea" },
            ],
          });
        } 
        // Histogram/Distribution detection
        else if (lower.includes("histogram") || 
                 lower.includes("age distribution") || 
                 lower.includes("distribution") ||
                 lower.includes("age") && lower.includes("users")) {
          setChartType("histogram");
          setChartData({
            labels: ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"],
            datasets: [
              { label: "Users", data: [45, 78, 52, 31, 18, 12], backgroundColor: "#764ba2" },
            ],
          });
        }
        // Correlation matrix detection
        else if (lower.includes("correlation") || 
                 lower.includes("correlation matrix") ||
                 lower.includes("numerical data")) {
          setChartType("bar"); // Using bar chart to represent correlation data
          setChartData({
            labels: ["Age", "Income", "Spending", "Satisfaction", "Engagement"],
            datasets: [
              { label: "Correlation", data: [0.85, 0.72, 0.91, 0.68, 0.79], backgroundColor: "#48bb78" },
            ],
          });
        }
        // Default: no chart
        else {
          setChartType(null);
          setChartData(null);
        }
      } catch {
        setOutput("Error generating code.");
        setChartType(null);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>
          <span className="title-main">🔗 Speak</span>
          <span className="title-gradient">QL</span>
        </h1>
        <p className="subtitle">Voice-Powered Natural Language to SQL & Data Analysis Code Generator</p>
        <div className="feature-badges">
          <div className="badge">🎤 Voice Recognition</div>
          <div className="badge">🔄 SQL Generation</div>
          <div className="badge">📊 Data Analysis Code</div>
          <div className="badge">📈 Chart Preview</div>
          <div className="badge">📄 PDF Reports</div>
          <div className="badge">📢 Insight Posts</div>
          <div className="badge">🚀 AI-Powered</div>
        </div>
      </div>
      {/* Restore mode toggle buttons above main-content */}
      <div className="main-controls">
        <button className={`mode-toggle${mode === 'sql' ? ' active' : ''}`} onClick={() => switchMode('sql')} id="sqlMode">🗄️ SQL Generator</button>
        <button className={`mode-toggle${mode === 'code' ? ' active' : ''}`} onClick={() => switchMode('code')} id="codeMode">📊 Data Analysis Code</button>
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
          {/* Action buttons for PDF, Insight Post, Email, and Alert */}
          {output !== "Your generated code will appear here..." && (
            <div className="action-buttons">
              <button 
                className="action-btn pdf-btn" 
                onClick={generatePDFReport}
                disabled={generatingPDF}
              >
                {generatingPDF ? "⏳ Generating..." : "📄 Download Report as PDF"}
              </button>
              <button 
                className="action-btn insight-btn" 
                onClick={generateInsightPost}
                disabled={generatingInsight}
              >
                {generatingInsight ? "⏳ Creating..." : "📢 Create Insight Post"}
              </button>
              <button 
                className="action-btn email-btn" 
                onClick={shareViaEmail}
                disabled={sharingEmail}
              >
                {sharingEmail ? "⏳ Opening..." : "📧 Share via Email"}
              </button>
              <button 
                className="action-btn alert-btn" 
                onClick={createAlert}
                disabled={creatingAlert}
              >
                {creatingAlert ? "⏳ Creating..." : "🚨 Create Alert"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Chart preview immediately after main-content */}
      {mode === 'code' && chartType && chartData && (
        <div style={{ maxWidth: 400, margin: '24px auto 0', height: 300 }}>
          <GraphBox chartType={chartType} data={chartData} />
        </div>
      )}
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
      
      {/* Feature Showcase Section */}
      <div className="feature-showcase">
        <div className="showcase-header">
          <h2 className="showcase-title">Everything You Need for Data-Driven Success</h2>
          <p className="showcase-subtitle">Powerful features designed to transform how you interact with your business data</p>
        </div>
        
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🗣️</div>
            <h3 className="feature-title">Natural Language Interface</h3>
            <p className="feature-description">Ask questions in plain English and get instant SQL queries or data analysis code.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">Universal Database Support</h3>
            <p className="feature-description">Connect to PostgreSQL, MySQL, MongoDB, and more with seamless integration.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Advanced Analytics</h3>
            <p className="feature-description">Generate sophisticated data analysis code with statistical insights and predictions.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3 className="feature-title">Creative Asset Generation</h3>
            <p className="feature-description">Transform insights into social media posts, infographics, and presentation materials.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-description">Get results in seconds, not hours. Optimize your business intelligence workflow.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Enterprise Security</h3>
            <p className="feature-description">Bank-grade security with SOC 2 compliance and end-to-end encryption.</p>
          </div>
        </div>
        
        <div className="how-it-works">
          <h2 className="how-it-works-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">01</div>
              <div className="step-icon">🔗</div>
              <h3 className="step-title">Connect Your Database</h3>
              <p className="step-description">Securely link your data sources with our one-click integration.</p>
            </div>
            
            <div className="step">
              <div className="step-number">02</div>
              <div className="step-icon">💬</div>
              <h3 className="step-title">Ask in Natural Language</h3>
              <p className="step-description">Type your question or analysis request in plain English.</p>
            </div>
            
            <div className="step">
              <div className="step-number">03</div>
              <div className="step-icon">⚡</div>
              <h3 className="step-title">Get Instant Results</h3>
              <p className="step-description">Receive SQL queries, analysis code, and visualizations immediately.</p>
            </div>
            
            <div className="step">
              <div className="step-number">04</div>
              <div className="step-icon">📤</div>
              <h3 className="step-title">Create & Share</h3>
              <p className="step-description">Transform insights into beautiful assets ready for presentation.</p>
            </div>
          </div>
        </div>
        
        <div className="cta-section">
          <h2 className="cta-title">Ready to Transform Your Data Strategy?</h2>
          <p className="cta-subtitle">Join thousands of businesses already using AI to unlock insights and create compelling content from their data.</p>
          <div className="cta-buttons">
            <button className="cta-btn primary">Start Free Trial →</button>
            <button className="cta-btn secondary">Schedule Demo</button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; overflow-x: hidden; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; color: white; position: relative; }
        .header h1 { font-size: 8.75rem; font-weight: 700; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; gap: 5px; }
        .title-main { color: #1a202c; }
        .title-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; }
        .header .subtitle { font-size: 1.3rem; opacity: 0.9; margin-bottom: 20px; }
        .feature-badges { 
          display: flex; 
          justify-content: center; 
          gap: 8px; 
          margin: 30px auto 0; 
          flex-wrap: nowrap; 
          overflow-x: auto; 
          padding: 15px 25px; 
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(15px);
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 90%;
          position: relative;
        }
        .feature-badges::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
        .badge { 
          background: rgba(255, 255, 255, 0.2); 
          backdrop-filter: blur(10px); 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 0.8rem; 
          border: 1px solid rgba(255, 255, 255, 0.3); 
          animation: float 3s ease-in-out infinite; 
          white-space: nowrap; 
          transition: all 0.3s ease;
          font-weight: 500;
        }
        .badge:hover { 
          background: rgba(255, 255, 255, 0.3); 
          transform: translateY(-3px); 
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .badge:nth-child(1) { animation-delay: 0s; }
        .badge:nth-child(2) { animation-delay: 0.3s; }
        .badge:nth-child(3) { animation-delay: 0.6s; }
        .badge:nth-child(4) { animation-delay: 0.9s; }
        .badge:nth-child(5) { animation-delay: 1.2s; }
        .badge:nth-child(6) { animation-delay: 1.5s; }
        .badge:nth-child(7) { animation-delay: 1.8s; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        .main-controls { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .mode-toggle { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: none; padding: 12px 24px; border-radius: 25px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .mode-toggle.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; transform: translateY(-2px); box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4); }
        .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .input-section, .output-section { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); transition: all 0.3s ease; }
        .input-section:hover, .output-section:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
        .section-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; color: #4a5568; display: flex; align-items: center; gap: 10px; }
        .section-icon { font-size: 1.8rem; }
        .input-area { width: 100%; min-height: 120px; padding: 15px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; resize: vertical; transition: all 0.3s ease; font-family: inherit; color: #000000; }
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
        
        /* Action buttons styling */
        .action-buttons { display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap; }
        .action-btn { 
          flex: 1; 
          min-width: 200px; 
          padding: 12px 20px; 
          border: none; 
          border-radius: 12px; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .action-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
          transform: none !important; 
        }
        .pdf-btn { 
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
          color: white; 
        }
        .pdf-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(72, 187, 120, 0.3); 
        }
        .insight-btn { 
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); 
          color: white; 
        }
        .insight-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(237, 137, 54, 0.3); 
        }
        .email-btn { 
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
          color: white; 
        }
        .email-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3); 
        }
        .alert-btn { 
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); 
          color: white; 
        }
        .alert-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3); 
        }
        
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
        @media (max-width: 768px) { 
          .main-content { grid-template-columns: 1fr; } 
          .header h1 { font-size: 2.5rem; } 
          .container { padding: 10px; } 
          .voice-controls { flex-direction: column; align-items: stretch; } 
          .feature-badges { 
            gap: 6px; 
            padding: 12px 20px; 
            max-width: 95%;
            border-radius: 40px;
          }
          .badge { 
            padding: 6px 12px; 
            font-size: 0.7rem; 
          }
          .action-buttons { flex-direction: column; }
          .action-btn { min-width: auto; }
        }
        
        /* Feature Showcase Styling */
        .feature-showcase {
          margin-top: 60px;
          padding: 60px 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 30px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .showcase-header {
          text-align: center;
          margin-bottom: 60px;
          padding: 0 40px;
        }
        
        .showcase-title {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
        }
        
        .showcase-subtitle {
          font-size: 1.2rem;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          padding: 0 40px;
          margin-bottom: 80px;
        }
        
        .feature-card {
          background: white;
          padding: 40px 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 1px solid #f3f4f6;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        
        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
        }
        
        .feature-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }
        
        .feature-description {
          color: #6b7280;
          line-height: 1.6;
          font-size: 1rem;
        }
        
        .how-it-works {
          padding: 0 40px;
          margin-bottom: 80px;
        }
        
        .how-it-works-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 50px;
        }
        
        .steps-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
        }
        
        .step {
          text-align: center;
          position: relative;
        }
        
        .step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          margin: 0 auto 20px;
        }
        
        .step-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: block;
        }
        
        .step-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .step-description {
          color: #6b7280;
          line-height: 1.6;
        }
        
        .cta-section {
          text-align: center;
          padding: 60px 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 20px;
          margin: 0 40px;
        }
        
        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
        }
        
        .cta-subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        
        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .cta-btn {
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          min-width: 180px;
        }
        
        .cta-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .cta-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .cta-btn.secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        
        .cta-btn.secondary:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
        }
        
        @media (max-width: 768px) {
          .showcase-title {
            font-size: 2rem;
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
          
          .feature-card {
            padding: 30px 20px;
          }
          
          .steps-container {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          
          .cta-section {
            padding: 40px 20px;
            margin: 0 20px;
          }
          
          .cta-title {
            font-size: 2rem;
          }
          
          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .cta-btn {
            width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
}
