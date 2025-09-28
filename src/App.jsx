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

// Simple ScoreBar Component
// Simple ScoreBar Component (Updated)
const ScoreBar = ({ label, score }) => {
  const getColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full">
        <div
          className={`h-full ${getColor(score)} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};
// Scoring functions
// Note: calculateFocusScore has been moved to the SystemHealthCard component

const calculatePrivacyScore = (metrics) => {
  const { openPorts, wifiSecure, riskyApps } = metrics;
  let score = 100;
  score -= openPorts * 5;
  if (!wifiSecure) score -= 30;
  score -= riskyApps.length * 10;
  return Math.max(0, Math.min(100, score)).toFixed(0);
};

const calculateNetworkScore = (metrics) => {
  console.log('calculateNetworkScore - Input metrics:', metrics);
  const { latencyMs, bandwidthMbps } = metrics;
  
  // Log initial values
  console.log(`Initial values - Latency: ${latencyMs}ms, Bandwidth: ${bandwidthMbps}Mbps`);
  
  let score = 100;
  
  // Stricter latency penalties (harsher penalties for higher latency)
  // 0-50ms: No penalty
  // 50-100ms: Linear penalty up to 20 points
  // 100-200ms: Linear penalty up to 50 points
  // 200ms+: Max penalty of 50 points
  let latencyPenalty = 0;
  if (latencyMs > 50) {
    if (latencyMs <= 100) {
      latencyPenalty = ((latencyMs - 50) / 2.5); // 0-20 points for 50-100ms
    } else if (latencyMs <= 200) {
      latencyPenalty = 20 + ((latencyMs - 100) * 0.3); // 20-50 points for 100-200ms
    } else {
      latencyPenalty = 50; // Max penalty for 200ms+
    }
  }
  
  // Stricter bandwidth penalties
  // 100Mbps+: No penalty
  // 50-100Mbps: Small penalty (0-10 points)
  // 20-50Mbps: Medium penalty (10-30 points)
  // 10-20Mbps: High penalty (30-50 points)
  // <10Mbps: Max penalty (50 points)
  let bandwidthPenalty = 0;
  if (bandwidthMbps < 100) {
    if (bandwidthMbps >= 50) {
      bandwidthPenalty = ((100 - bandwidthMbps) * 0.2); // 0-10 points
    } else if (bandwidthMbps >= 20) {
      bandwidthPenalty = 10 + ((50 - bandwidthMbps) * 0.67); // 10-30 points
    } else if (bandwidthMbps >= 10) {
      bandwidthPenalty = 30 + ((20 - bandwidthMbps) * 2); // 30-50 points
    } else {
      bandwidthPenalty = 50; // Max penalty for <10Mbps
    }
  }
  
  // Apply penalties
  score -= latencyPenalty;
  score -= bandwidthPenalty;
  
  // Ensure score is within bounds
  const finalScore = Math.max(0, Math.min(100, score)).toFixed(0);
  
  console.log('Score breakdown:', {
    baseScore: 100,
    latencyPenalty: latencyPenalty.toFixed(1),
    bandwidthPenalty: bandwidthPenalty.toFixed(1),
    totalPenalty: (latencyPenalty + bandwidthPenalty).toFixed(1),
    rawScore: score.toFixed(1),
    finalScore
  });
  
  return finalScore;
};

const calculateLoadScore = (metrics) => {
  const { cpuLoad, ramLoad } = metrics;
  const avgLoad = (cpuLoad + ramLoad) / 2;
  let score = 100 - avgLoad;
  return Math.max(0, Math.min(100, score)).toFixed(0);
};

const calculateOverallScore = (focus, privacy, network, systemload) => {
  return ((parseFloat(focus) + parseFloat(privacy) + parseFloat(network) + parseFloat(systemload)) / 4).toFixed(0);
};

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
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
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
        color: '#1F2937',
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
          color: '#4B5563',
        },
        grid: {
          color: '#E5E7EB',
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

// Combined System Resources & Report Card
const SystemHealthCard = ({ cpuLoad, ramLoad, privacyInfo, contextSwitches, productiveTime, contextSwitchHistory, networkMetrics }) => {
  // Debug logging for props
  console.log('SystemHealthCard props:', {
    contextSwitches,
    productiveTime,
    contextSwitchHistory: contextSwitchHistory?.length || 0,
    networkMetrics
  });

  // Calculate focus score based on recent context switches and productive time
  const calculateFocusScore = () => {
    try {
      // Get context switches in the last 10 minutes
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      const recentSwitches = Array.isArray(contextSwitchHistory) 
        ? contextSwitchHistory.filter(switchTime => switchTime > tenMinutesAgo).length
        : 0;

      // Calculate productive time percentage (last 10 minutes)
      const totalTime = 10 * 60 * 1000; // 10 minutes in ms
      const productivePercentage = Math.min(1, (productiveTime || 0) / totalTime);
      
      console.log('Focus Score Calculation:', {
        recentSwitches,
        productiveTime: productiveTime || 0,
        productivePercentage: (productivePercentage * 100).toFixed(1) + '%'
      });
      
      // Base score (0-100)
      let score = 100;
      
      // Penalize for context switches (more switches = lower score)
      // Each switch in the last 10 minutes reduces score by 5 points, max 50 points penalty
      const switchPenalty = Math.min(50, recentSwitches * 5);
      score -= switchPenalty;
      
      // Reward for productive time (more productive time = higher score)
      // Up to 30 points based on productive percentage
      const productiveBonus = productivePercentage * 30;
      score = Math.min(100, score + productiveBonus);
      
      // Ensure score is between 0 and 100
      const finalScore = Math.max(0, Math.min(100, Math.round(score)));
      console.log('Final focus score:', finalScore);
      
      return finalScore;
    } catch (error) {
      console.error('Error calculating focus score:', error);
      return 100; // Default to 100 if there's an error
    }
  };
  
  const focus = calculateFocusScore();
  
  const privacy = parseFloat(privacyInfo?.privacyScore || calculatePrivacyScore({ 
    openPorts: privacyInfo?.openPorts || 0, 
    wifiSecure: privacyInfo?.wifiSecure || false, 
    riskyApps: [] 
  }));
  const network = parseFloat(calculateNetworkScore(networkMetrics));
  const systemload = parseFloat(calculateLoadScore({ cpuLoad, ramLoad }));
  const overall = parseFloat(calculateOverallScore(focus, privacy, network, systemload));

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg font-large mb-4">System Health & Resources</h3>
      
      {/* System Resources */}
      <div className="space-y-3 mb-4">
        
      </div>
      
      <div className="border-t border-gray-700 my-3"></div>
      
      {/* Health Scores */}
      <div className="space-y-3 text-lg font-large font-bold">
        <ScoreBar label="Focus" score={focus} />
        <ScoreBar label="Privacy" score={privacy} />
        <ScoreBar label="Network" score={network} />
        <ScoreBar label="System Load" score={systemload} />
        <div className="border-t border-gray-700 my-3"></div>
        <ScoreBar label="Overall" score={overall} />
      </div>
      
    
    </div>
  );
};

// Process Stats Component


// Main Dashboard Component
const Dashboard = () => {
  const [activeWindow, setActiveWindow] = useState({ title: 'Loading...', app: 'Loading...' });
  const [appHistory, setAppHistory] = useState([{ app: "Chrome", totalMinutes: 45 }]);
  const [wifiInfo, setWifiInfo] = useState({ ssid: 'Checking...', quality: 0, success: false });
  const [systemLoad, setSystemLoad] = useState({ cpuLoad: 0, ramLoad: 0 });
  const [processStats, setProcessStats] = useState({ total: 0, user: 0 });
  const [privacyInfo, setPrivacyInfo] = useState(null);
  const [screenTime, setScreenTime] = useState("0.0h");
  const [distractions, setDistractions] = useState(0);
  const [networkMetrics, setNetworkMetrics] = useState({ latencyMs: 0, packetLossPct: 0, bandwidthMbps: 30 });
  const [contextSwitches, setContextSwitches] = useState(0);
  const [productiveTime, setProductiveTime] = useState(0);
  const [lastApp, setLastApp] = useState(null);
  const [appStartTime, setAppStartTime] = useState(Date.now());
  const [contextSwitchHistory, setContextSwitchHistory] = useState([]);

  // Reset productive time every 10 minutes to only track recent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setProductiveTime(0);
      setContextSwitchHistory([]);
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  // List of work-related apps
  const workApps = [
    'VS Code', 'Visual Studio Code', 'Visual Studio', 'IntelliJ', 'Terminal', 'iTerm', 'WebStorm',
    'PyCharm', 'Android Studio', 'Xcode', 'Sublime Text', 'Atom', 'Vim',
    'Neovim', 'Emacs', 'Eclipse', 'Figma', 'Sketch', 'Postman', 'Docker',
    'GitHub Desktop', 'GitKraken', 'Notion', 'Obsidian', 'Jupyter', 'RStudio',
    'MATLAB', 'Tableau', 'Excel', 'Google Chrome', 'Firefox', 'Safari', 'Brave',
    'Code'  // Sometimes VS Code is just 'Code'
  ];

  // Check if an app is productive
  const isProductiveApp = (appName) => {
    if (!appName) {
      console.log('isProductiveApp: No app name provided');
      return false;
    }
    
    const appLower = appName.toLowerCase();
    const isProductive = workApps.some(workApp => {
      const workAppLower = workApp.toLowerCase();
      const matches = appLower.includes(workAppLower);
      if (matches) {
        console.log(`Matched productive app: ${appName} (matches ${workApp})`);
      }
      return matches;
    });
    
    if (!isProductive) {
      console.log(`App not in productive list: ${appName}`);
    }
    
    return isProductive;
  };

  // Calculate focus score based on context switches and productive time
  const calculateFocusScore = () => {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const recentSwitches = contextSwitchHistory.filter(switchTime => switchTime > tenMinutesAgo).length;
    const totalTime = 10 * 60 * 1000; // 10 minutes in ms
    const productivePercentage = Math.min(1, productiveTime / totalTime);
    
    // Start with a base score of 100
    let score = 100;
    
    // Penalize for context switches (up to -50 points)
    // Each switch costs 5 points, max 10 switches (50 points)
    const switchPenalty = Math.min(50, recentSwitches * 5);
    score -= switchPenalty;
    
    // Reward for productive time (more productive time = higher score)
    // Up to 30 points based on productive percentage
    const productiveBonus = productivePercentage * 30;
    score = Math.min(100, score + productiveBonus);
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const fetchAppHistory = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const history = await window.electronAPI.invoke('collector:getHistory');
        if (history) {
          setAppHistory(history);
          // Calculate distractions
          const nonWorkApps = ['Discord', 'YouTube', 'Netflix', 'Twitch', 'Spotify', 'Steam'];
          const distractionCount = history.filter(item => 
            nonWorkApps.some(app => item.app?.toLowerCase().includes(app.toLowerCase()))
          ).length;
          setDistractions(distractionCount);
        }
      } catch (e) {
        console.error("Error fetching app history:", e);
      }
    }
  };

  const fetchActiveWindow = async () => {
    if (!window.electronAPI?.invoke) return;
    
    try {
      const data = await window.electronAPI.invoke('collector:activeWindow');
      if (!data?.success) return;
      
      const currentApp = data.app || 'Unknown';
      const currentTime = Date.now();
      
      // Initialize lastApp and appStartTime if this is the first run
      if (lastApp === null) {
        console.log(`Initial app: ${currentApp}`);
        setLastApp(currentApp);
        setAppStartTime(currentTime);
        setActiveWindow({
          title: data.title || 'No title',
          app: currentApp
        });
        return;
      }
      
      // Only process if the app has changed
      if (currentApp !== lastApp) {
        const timeSpent = currentTime - appStartTime;
        const wasProductive = isProductiveApp(lastApp);
        
        console.log(`Switched from ${lastApp} to ${currentApp} after ${timeSpent}ms`);
        console.log(`Was productive: ${wasProductive}`);
        
        // Update productive time if previous app was productive
        if (wasProductive) {
          setProductiveTime(prev => {
            const newTime = prev + timeSpent;
            console.log(`Updated productive time: ${newTime}ms`);
            return newTime;
          });
        }
        
        // Update context switch history
        setContextSwitchHistory(prev => {
          const tenMinutesAgo = currentTime - (10 * 60 * 1000);
          const updatedHistory = [...prev.filter(time => time > tenMinutesAgo), currentTime];
          console.log(`Context switches in last 10m: ${updatedHistory.length}`);
          return updatedHistory;
        });
        
        setContextSwitches(prev => {
          const newCount = prev + 1;
          console.log(`Total context switches: ${newCount}`);
          return newCount;
        });
        
        // Update last app and start time for the new app
        setLastApp(currentApp);
        setAppStartTime(currentTime);
      }
      
      // Always update the active window display
      setActiveWindow({
        title: data.title || 'No title',
        app: currentApp
      });
      
    } catch (e) {
      console.error("Error in fetchActiveWindow:", e);
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

  const fetchSystemLoad = async () => {
    if (window.electronAPI && window.electronAPI.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:systemLoad');
        if (data) {
          setSystemLoad(data);
        }
      } catch (e) {
        console.error("Error fetching system load:", e);
      }
    }
  };

  const fetchProcessStats = async () => {
    if (window.electronAPI?.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:runningProcesses');
        if (data) {
          setProcessStats(data);
        }
      } catch (e) {
        console.error("Error fetching process stats:", e);
      }
    }
  };

  const fetchPrivacyInfo = async () => {
    if (window.electronAPI?.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:privacyInfo');
        if (data) {
          setPrivacyInfo(data);
        }
      } catch (e) {
        console.error("Error fetching privacy info:", e);
      }
    }
  };
  const fetchNetworkMetrics = async () => {
    if (window.electronAPI?.invoke) {
      try {
        const data = await window.electronAPI.invoke('collector:networkMetrics');
        if (data && data.success) {
          // Keep existing bandwidth, only update dynamic values
          setNetworkMetrics(prevMetrics => ({
            ...prevMetrics,
            latencyMs: data.latencyMs,
            packetLossPct: data.packetLossPct,
          }));
        }
      } catch (e) {
        console.error("Error fetching network metrics:", e);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActiveWindow();
    fetchAppHistory();
    fetchWifiData();
    fetchSystemLoad();
    fetchProcessStats();
    fetchPrivacyInfo();
    fetchNetworkMetrics();

    // Set up interval for periodic updates - increased to 10 seconds
    const intervalId = setInterval(() => {
      fetchActiveWindow();
      fetchAppHistory();
      fetchWifiData();
      fetchSystemLoad();
      fetchProcessStats();
      fetchPrivacyInfo();
      fetchNetworkMetrics();
    }, 10000); // Increased to 10 seconds to reduce load

    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Calculate productivity score based on work apps vs total time
  const calculateProductivity = () => {
    const workApps = ['VS Code', 'Visual Studio', 'IntelliJ', 'Terminal', 'Chrome', 'Firefox'];
    const workTime = appHistory
      .filter(item => workApps.some(app => item.app.includes(app)))
      .reduce((acc, item) => acc + parseFloat(item.totalMinutes), 0);
    const totalTime = appHistory.reduce((acc, item) => acc + parseFloat(item.totalMinutes), 0);
    return totalTime > 0 ? Math.round((workTime / totalTime) * 100) + '%' : '0%';
  };

  const getMostUsedApp = () => {
    if (!appHistory || appHistory.length === 0) return 'None';
    return appHistory.reduce((prev, current) => 
      (prev.totalMinutes > current.totalMinutes) ? prev : current
    ).app;
  };

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
             <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              {/* WiFi and Privacy info section */}
              <div className="grid grid-cols-2 gap-4 items-start">
                {/* Left side: WiFi name + signal strength */}
                <div className="text-gray-300 text-sm space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">WiFi:</span>
                    <span className="font-semibold truncate">
                      {wifiInfo.success ? wifiInfo.ssid : 'Not Connected'}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Signal Strength:</span>
                    <span className="font-semibold">
                      {wifiInfo.success ? `${wifiInfo.quality}%` : 'N/A'}
                    </span>
                  </p>
                </div>

                {/* Right side: Encryption / Security Info */}
                {privacyInfo?.currentNetwork && (
                  <div className="text-sm text-gray-400 space-y-2 text-right">
                    <p className="flex justify-end items-center gap-2">
                      <span className="text-gray-500 font-medium">Security:</span>
                      <span className={`font-semibold truncate max-w-[150px] ${
                        privacyInfo.currentNetwork.security.includes("WPA2") || 
                        privacyInfo.currentNetwork.security.includes("WPA3")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                    {(privacyInfo.currentNetwork.security.includes("WPA2") ||
                    privacyInfo.currentNetwork.security.includes("WPA3"))
                    ? privacyInfo.currentNetwork.security.includes("WPA2") && privacyInfo.currentNetwork.security.includes("WPA3")
                      ? "WPA2/3"
                      : privacyInfo.currentNetwork.security.includes("WPA3")
                        ? "WPA3"
                        : "WPA2"
                    : privacyInfo.currentNetwork.security}
                    </span>
                    </p>
                    <p className="flex justify-end items-center gap-2">
                      <span className="text-gray-500 font-medium">Encrypted:</span>
                      <span className={`font-semibold ${
                        privacyInfo.wifiSecure ? "text-green-400" : "text-red-400"
                      }`}>
                        {privacyInfo.wifiSecure ? "Yes" : "No"}
                      </span>
                    </p>
                    {privacyInfo.hasVPN && (
                      <p className="text-green-400 font-semibold">VPN Active</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard title="Running Processes" score={processStats.total.toString()} color="green" />
                <ScoreCard title="Productivity" score={calculateProductivity()} color="blue" />
                <ScoreCard title="Screen Time" score={screenTime} color="yellow" />
                <ScoreCard title="Most Used App" score={getMostUsedApp()} color="purple" />
              </div>
            </div>
            <SystemHealthCard 
              cpuLoad={systemLoad.cpuLoad} 
              ramLoad={systemLoad.ramLoad} 
              privacyInfo={privacyInfo}
              networkMetrics={networkMetrics}
              contextSwitches={contextSwitches}
              productiveTime={productiveTime}
              contextSwitchHistory={contextSwitchHistory}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default function App() {
  return <Dashboard />;
}