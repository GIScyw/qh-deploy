const msg = require('./msg')

module.exports = {
  success: (text) => {
    console.log(msg.success(text))
  },

  warn: (text) => {
    console.warn(msg.warn(text))
  },

  fail: (text) => {
    console.error(msg.fail(text))
  },
}