// This is the configuration file

var environments = {};

// Staging environment
environments.staging = {
  'port': 3000,
  'envName': 'staging',
  'hashingSecret' : 'thisIsMySecret',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'ACb066e19b7de9e33cb7e02fcf0efbfa26',
    'authToken': '3d04a8f83238eb95df4e96d709216bfe',
    'fromPhone': '+19723829386'
  }
};

environments.production = {
  'port': 8000,
  'envName': 'production',
  'hashingSecret' : 'thisIsMySecret',
  'maxChecks': 5
};

// Get ENV from process. On default staging
const currentEnv = (typeof (process.env.NODE_ENV) === 'string') ? process.env.NODE_ENV.toLowerCase() : 'staging';
let envToExport = '';

if (typeof (environments[currentEnv]) === 'object') {
  envToExport = environments[currentEnv]
}

module.exports = envToExport;
