const chalk = require('chalk')

module.exports = {
  success: (msg) => {
    return `${chalk.green(msg)}`
  },

  warn: (msg) => {
    return `${chalk.yellow(msg)}`
  },

  fail: (msg) => {
    return `${chalk.red(msg)}`
  },
}