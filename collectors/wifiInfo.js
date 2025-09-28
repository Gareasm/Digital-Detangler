const si = require('systeminformation');

module.exports = async function collectWifiInfo() {
  try {
    const wifiData = await si.wifiConnections();
    return wifiData;
    } catch (error) {
    console.error('Error collecting WiFi information:', error);
    return null;
    }
};