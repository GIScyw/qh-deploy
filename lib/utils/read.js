const read = require('read')

module.exports = (opt) => {
  if (typeof opt == 'string') {
    opt = {
      prompt: opt
    }
  }
  return new Promise((resolve, reject) => {
    read(opt, (err, res) => {
      if (err) return reject(err)

      resolve(res)
    })
  })
}
