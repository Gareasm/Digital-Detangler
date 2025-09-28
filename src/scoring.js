// scoring.js
export function mapToScore(value, good, bad) {
  if (value <= good) return 10;
  if (value >= bad) return 0;
  return 10 - ((value - good) / (bad - good)) * 10;
}

export function calculateFocusScore({ contextSwitchesPerHour, socialMediaPct, workPct }) {
  const contextScore = mapToScore(contextSwitchesPerHour, 0, 15);
  const socialScore  = mapToScore(socialMediaPct, 0, 40);
  const workScore    = mapToScore(100 - workPct, 40, 100);
  return (contextScore * 0.4 + socialScore * 0.3 + workScore * 0.3).toFixed(1);
}

export function calculateLoadScore({cpuLoad, ramLoad}){
    const cpuScore = mapToScore(cpuLoad, 0, 100);
    const ramScore = mapToScore(ramLoad, 0, 100);
    return (cpuScore * 0.5 + ramScore * 0.5).toFixed(1);
}

export function calculatePrivacyScore({ openPorts, wifiSecure, riskyApps }) {
  const portsScore = mapToScore(openPorts, 2, 10);
  const wifiScore  = wifiSecure ? 10 : 0;
  const riskyScore = riskyApps.some(app =>
    ["torrent", "keylogger", "remote desktop"].includes(app.toLowerCase())
  ) ? 3 : 10;
  return (portsScore * 0.4 + wifiScore * 0.3 + riskyScore * 0.3).toFixed(1);
}

export function calculateNetworkScore({ latencyMs, packetLossPct, bandwidthMbps }) {
  const latencyScore   = mapToScore(latencyMs, 50, 200);
  const packetLossScore= mapToScore(packetLossPct, 0, 5);
  const bandwidthScore = mapToScore(bandwidthMbps, 50, 2);
  return (latencyScore * 0.4 + packetLossScore * 0.3 + bandwidthScore * 0.3).toFixed(1);
}

export function calculateOverallScore(focus, privacy, network) {
  return (focus * 0.4 + privacy * 0.3 + network * 0.3).toFixed(1);
}
