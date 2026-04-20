const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel =
  LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelName = Object.keys(LOG_LEVELS).find((k) => LOG_LEVELS[k] === level);

  if (level <= currentLevel) {
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...(data && { data }),
    };

    console.log(JSON.stringify(logEntry));
  }
}

module.exports = {
  error: (message, data) => log(LOG_LEVELS.ERROR, message, data),
  warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
  info: (message, data) => log(LOG_LEVELS.INFO, message, data),
  debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data),
};
