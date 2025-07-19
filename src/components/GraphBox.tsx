import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
}

export type GraphBoxProps = {
  chartType: 'bar' | 'histogram' | null;
  data: ChartData;
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#333',
      bodyColor: '#333',
      borderColor: '#667eea',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#888', font: { weight: 'bold' as const } },
    },
    y: {
      grid: { color: '#f3f3f3' },
      ticks: { color: '#888', font: { weight: 'bold' as const } },
    },
  },
  elements: {
    bar: {
      borderRadius: 8,
      borderSkipped: false,
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea: { bottom: number; top: number } | null } }) => {
        const chart = ctx.chart;
        const { ctx: canvasCtx, chartArea } = chart;
        if (!chartArea) return '#667eea';
        const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, '#764ba2');
        gradient.addColorStop(1, '#667eea');
        return gradient;
      },
      barThickness: 36,
    },
  },
};

export default function GraphBox({ chartType, data }: GraphBoxProps) {
  if (!chartType || !data) return null;
  const title = chartType === 'bar' ? 'Bar Chart Preview' : 'Histogram Preview';
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 flex flex-col items-center" style={{ border: '1px solid #f3f3f3' }}>
      <h3 className="font-bold mb-6 text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400" style={{ letterSpacing: 1 }}>{title}</h3>
      <div style={{ width: '100%', minHeight: 220 }}>
        <Bar data={data} options={chartOptions} />
      </div>
    </div>
  );
} 