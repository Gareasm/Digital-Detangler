import React, { useState, useEffect } from 'react';

// Simple ScoreCard Component
const ScoreCard = ({ title, score, color = "blue" }) => (
  <div className={`bg-gray-800 p-4 rounded-lg border-l-4 border-${color}-500`}>
    <h3 className="text-white text-sm font-medium">{title}</h3>
    <p className={`text-${color}-400 text-2xl font-bold`}>{score}</p>
  </div>
);

// Simple ActiveActivityCard Component
const ActiveActivityCard = ({ title, app }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h3 className="text-white text-sm font-medium mb-2">Currently Active</h3>
    <div className="text-green-400">
      <p className="font-semibold">{app}</p>
      <p className="text-sm text-gray-400 truncate">{title}</p>
    </div>
  </div>
);

// Main Dashboard Component
const Dashboard = () => {
  const [activeWindow, setActiveWindow] = useState({ 
    title: 'Loading...', 
    app: 'Loading...' 
  });

  // Function to call the Electron Main process
  const fetchActiveWindowData = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:activeWindow');
        
        if (data && data.success) {
          setActiveWindow({
            title: data.title,
            app: data.app,
          });
        } else {
          console.warn("Active window data fetch failed:", data);
          setActiveWindow({ 
            title: 'Monitoring Failed', 
            app: 'Check Console' 
          });
        }
      } catch (e) {
        console.error("IPC Invoke Error:", e);
        setActiveWindow({ 
          title: 'IPC Error', 
          app: 'API Bridge Down' 
        });
      }
    } else {
      // Fallback for development mode
      setActiveWindow({ 
        title: 'Development Mode - No Electron API', 
        app: 'Vite Dev Server' 
      });
    }
  };

  // Test function
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
    
    // Set up interval to fetch data every 2 seconds
    const intervalId = setInterval(fetchActiveWindowData, 2000);

    return () => clearInterval(intervalId);
  }, []); 

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
      <div className="w-full h-full max-w-[800px] max-h-[800px] p-6">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Digital Detangler Dashboard
            </h1>
            <p className="text-gray-400">
              Monitor and optimize your digital workflow
            </p>
          </div>

          {/* Test Button */}
          <div className="mb-4">
            <button 
              onClick={testConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Test Electron Connection
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ScoreCard title="Focus Score" score="85%" color="green" />
            <ScoreCard title="Productivity" score="72%" color="blue" />
            <ScoreCard title="Screen Time" score="6.2h" color="yellow" />
            <ScoreCard title="Distractions" score="23" color="red" />
          </div>

          {/* Current Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            <ActiveActivityCard 
              title={activeWindow.title}
              app={activeWindow.app}
            />
            
            {/* Additional info card */}
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
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return <Dashboard />;
}