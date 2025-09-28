const si = require('systeminformation');

module.exports = async function collectSystemLoad() {
  try {
    //console.log('Collecting system load data...');
    const cpuData = await si.currentLoad();
    const memData = await si.mem();
    
   // console.log('Raw CPU Data:', cpuData); // Add full CPU data logging
    
    const result = {
      cpuLoad: Math.round(cpuData.currentLoad || 0), // Fix property name and add fallback
      ramLoad: (memData.active / memData.total) * 100
    };
    
    //console.log('Returning system load result:', result);
    return result;
  } catch (error) {
    console.error('Error collecting system load information:', error);
    return null;
  }
};