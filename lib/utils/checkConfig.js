/**
 * 
 * @param {*} config 
 * @return {Array} 未填写的配置
 */

const path = require('path')
const fs = require('fs')

module.exports = (env) => {
  return new Promise((resolve, reject) => {
    const rcPath = path.resolve('.zeployrc')

    if (!fs.existsSync(rcPath)) {
      return reject('配置文件不存在！')
    }
  
    let config = JSON.parse(fs.readFileSync(rcPath, 'utf-8'))[env]
  
    if (!config) {
      return reject('当前配置不存在！')
    }
    else {
      const emptyKeys = []
  
      if (!config.ssh.host) {
        emptyKeys.push('host')
      }
    
      if (!config.ssh.username) {
        emptyKeys.push('username')
      }
    
      if (!config.ssh.password) {
        emptyKeys.push('password')
      }
    
      if (!config.distPath) {
        emptyKeys.push('distPath')
      }
    
      if (!config.targetPath) {
        emptyKeys.push('targetPath')
      }
  
      if (emptyKeys.length) {
        return reject(`请先配置${emptyKeys.join('、')}`)
      }
    }

    resolve(config)
  })
}