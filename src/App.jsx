import React, { useState, useEffect } from 'react';
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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Simple ScoreCard Component
const ScoreCard = ({ title, score, color = "blue" }) => (
  <div className={`bg-gray-800 p-4 rounded-lg border-l-4 border-${color}-500`}>
    <h3 className="text-white text-sm font-medium">{title}</h3>
    <p className={`text-${color}-400 text-2xl font-bold`}>{score}</p>
  </div>
);

// Simple ActiveActivityCard Component
const ActiveActivityCard = ({ title, app, details }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h3 className="text-white text-sm font-medium mb-2">Currently Active</h3>
    <div className="text-green-400">
      <p className="font-semibold">{app}</p>
      <p className="text-sm text-gray-400 truncate">{title}</p>
      {details && (
        <div className="mt-2 text-xs text-gray-500">
          <p>PID: {details.pid}</p>
          <p className="truncate">Path: {details.path}</p>
        </div>
      )}
    </div>
  </div>
);

// ProcessTimeLog Component
const ProcessTimeLog = ({ appHistory }) => {
  return (
    <div className="mt-10 mx-auto max-w-2xl px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
        Process Time Log
      </h2>
      <div className="space-y-4">
        {appHistory.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
          >
            <span className="text-base font-medium text-gray-700">{item.app}</span>
            <span className="text-lg font-semibold text-indigo-600">
              {item.totalMinutes} min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// BarGraph Component
const UsageBarGraph = ({ appHistory }) => {
  const data = {
    labels: appHistory.map(item => item.app),
    datasets: [
      {
        label: 'Total Minutes',
        data: appHistory.map(item => item.totalMinutes),
        backgroundColor: 'rgba(99, 102, 241, 0.6)', // Indigo-600 with opacity
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'App Usage History (Minutes)',
        color: '#1F2937', // Gray-900
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes',
          color: '#1F2937',
        },
        ticks: {
          color: '#4B5563', // Gray-600
        },
        grid: {
          color: '#E5E7EB', // Gray-200
        },
      },
      x: {
        ticks: {
          color: '#4B5563',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="mt-10 mx-auto max-w-2xl px-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeWindow, setActiveWindow] = useState({ title: 'Loading...', app: 'Loading...' });
  const [appHistory, setAppHistory] = useState([
    { app: "App1", totalMinutes: 30 },
    { app: "App2", totalMinutes: 45 },
    { app: "App3", totalMinutes: 20 },
  ]);
  const [wifiInfo, setWifiInfo] = useState({ ssid: 'Checking...', quality: 0, success: false });

  const fetchAppHistory = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const history = await window.electronAPI.invoke('collector:getHistory');
        if (history && history.length > 0) {
          setAppHistory(history);
        }
      } catch (e) {
        console.error("Error fetching app history:", e);
      }
    }
  };

  const fetchActiveWindowData = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:activeWindow');
        if (data && data.success) {
          setActiveWindow({
            title: data.title,
            app: data.app,
            details: data.details,
          });
        } else {
          console.warn("Active window data fetch failed:", data);
          setActiveWindow({
            title: 'Monitoring Failed',
            app: 'Check Console',
            details: null,
          });
        }
      } catch (e) {
        console.error("IPC Invoke Error:", e);
        setActiveWindow({
          title: 'IPC Error',
          app: 'API Bridge Down',
          details: null,
        });
      }
    } else {
      setActiveWindow({
        title: 'Development Mode - No Electron API',
        app: 'Vite Dev Server',
      });
    }
  };

  const fetchWifiData = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:wifiInfo');
        setWifiInfo(data);
      } catch (e) {
        console.error("IPC Invoke Error for WiFi:", e);
        setWifiInfo({ ssid: 'IPC Error', quality: 0, success: false });
      }
    }
  };

  const testConnection = async () => {
    if (window.electronAPI && window.electronAPI.pingTest) {
      try {
        const response = await window.electronAPI.pingTest();
        console.log("Ping test result:", response);
        alert(`Connection test: ${response}`);
      } catch (error) {
        console.error("Ping test failed:", error);
        alert("Connection test failed");
      }
    } else {
      alert("No Electron API available");
    }
  };

  useEffect(() => {
    fetchActiveWindowData();
    fetchAppHistory();
    fetchWifiData();

    const intervalId = setInterval(() => {
      fetchActiveWindowData();
      fetchAppHistory();
      fetchWifiData();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
      <div className="w-full h-full max-w-[1200px] max-h-[900px] p-6 overflow-y-auto">
        <div className="h-full flex flex-col">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Digital Detangler Dashboard
              </h1>
              <p className="text-gray-400">
                Monitor and optimize your digital workflow
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="text-gray-300 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Wifi:</span>
                  <span className="font-medium">{wifiInfo.ssid}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Signal Strength:</span>
                  <span className="font-medium">{wifiInfo.quality}%</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={testConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Test Electron Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ScoreCard title="Focus Score" score="85%" color="green" />
            <ScoreCard title="Productivity" score="72%" color="blue" />
            <ScoreCard title="Screen Time" score="6.2h" color="yellow" />
            <ScoreCard title="Distractions" score="23" color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            <ActiveActivityCard
              title={activeWindow.title}
              app={activeWindow.app}
              details={activeWindow.details}
            />
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white text-sm font-medium mb-2">System Status</h3>
              <div className="text-gray-300">
                <p className="text-sm">
                  Electron API: {window.electronAPI ? '✅ Connected' : '❌ Not Available'}
                </p>
                <p className="text-sm">
                  Last Update: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <ProcessTimeLog appHistory={appHistory} />
          <UsageBarGraph appHistory={appHistory} />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return <Dashboard />;
}