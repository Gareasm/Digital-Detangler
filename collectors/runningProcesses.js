const si = require('systeminformation');

module.exports = async function collectRunningProcesses() {
  try {
    const data = await si.processes();
    return {
      total: data.all || 0,
      running: data.running || 0,
      blocked: data.blocked || 0,
      sleeping: data.sleeping || 0
    };
  } catch (error) {
    console.error('Error collecting process information:', error);
    return null;
  }
};
