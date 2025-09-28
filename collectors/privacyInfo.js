const si = require('systeminformation');

const COLLECTOR_NAME = 'collector:privacyInfo';

async function collectPrivacyInfo() {
  try {
    const [currentConnections, networkInterfaces] = await Promise.all([
      si.wifiConnections(),
      si.networkInterfaces()
    ]);
    
    let wifiSecure = false;
    let currentNetwork = null;
    
    if (currentConnections && currentConnections.length > 0) {
      currentNetwork = currentConnections[0];
      
      if (currentNetwork && currentNetwork.ssid) {
        const securityType = String(currentNetwork.security || '').toLowerCase();
        
        wifiSecure = securityType.includes('wpa2') || 
                     securityType.includes('wpa3') || 
                     securityType.includes('wpa');
        
        if (securityType.includes('open') || securityType === '') {
          wifiSecure = false;
        }
      }
    }
    
    const riskyPorts = [21, 22, 23, 139, 445, 3389];
    let openPorts = 0;
    
    const hasVPN = networkInterfaces.some(iface => 
      iface.ifaceName && 
      String(iface.ifaceName).toLowerCase().match(/vpn|tun|tap/)
    );
    
    return {
      wifiSecure,
      currentNetwork: currentNetwork ? {
        ssid: currentNetwork.ssid,
        security: currentNetwork.security || 'Unknown',
        encrypted: wifiSecure
      } : null,
      openPorts,
      hasVPN,
      privacyScore: calculatePrivacyScore(wifiSecure, openPorts, hasVPN)
    };
    
  } catch (error) {
    console.error('Error collecting privacy information:', error);
    return {
      wifiSecure: false,
      currentNetwork: null,
      openPorts: 0,
      hasVPN: false,
      privacyScore: 0
    };
  }
};

function calculatePrivacyScore(wifiSecure, openPorts, hasVPN) {
  let score = 100;
  
  if (!wifiSecure) score -= 30;
  
  score -= Math.min(openPorts * 5, 30);
  
  if (hasVPN) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  name: COLLECTOR_NAME,
  collect: collectPrivacyInfo
};