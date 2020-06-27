const chalk = require('chalk')

const prefixes = {
  wait: chalk.cyan('wait') + '  -',
  error: chalk.red('error') + ' -',
  warn: chalk.yellow('warn') + '  -',
  ready: chalk.green('ready') + ' -',
  info: chalk.cyan('info') + '  -',
  event: chalk.magenta('event') + ' -'
}

function wait(...message) {
  console.log(prefixes.wait, ...message)
}

function error(...message) {
  console.log(prefixes.error, ...message)
}

function warn(...message) {
  console.log(prefixes.warn, ...message)
}

function ready(...message) {
  console.log(prefixes.ready, ...message)
}

function info(...message) {
  console.log(prefixes.info, ...message)
}

function event(...message) {
  console.log(prefixes.event, ...message)
}

module.exports = {
  wait,
  error,
  warn,
  ready,
  info,
  event
}
