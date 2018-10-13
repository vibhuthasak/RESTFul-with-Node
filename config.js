// This is the configuration file

var environments = {}

// Staging environment
environments.staging = {
  'port': 3000,
  'envName': 'staging'
}

environments.production = {
  'port': 8000,
  'envName': 'production'
}

// Get ENV from process. On default staging
const currentEnv = (typeof (process.env.NODE_ENV) === 'string') ? process.env.NODE_ENV.toLowerCase() : 'staging';
var envToExport = '';

if (typeof (environments[currentEnv]) === 'object') {
  envToExport = environments[currentEnv]
}

module.exports = envToExport;
