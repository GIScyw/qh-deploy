const fs = require('fs')
const path = require('path')
const read = require('./utils/read')
const log = require('./utils/log')

const configTemplate = {
  ssh: {
    host: '',
    username: '',
    password: ''
  },
  distPath: '',
  targetPath: '',
  keepReleases: '10'
}

module.exports = async (env) => {
  const rcPath = path.resolve('.zeployrc')

  let oldConfig = {}

  if (fs.existsSync(rcPath)) {
    oldConfig = JSON.parse(fs.readFileSync(rcPath, 'utf-8'))
  }

  if (oldConfig[env]) {
    log.fail('当前配置已经存在！')
  }
  else {
    try {
      configTemplate.ssh.host = await read('ssh.host:')
      configTemplate.ssh.username = await read('ssh.username:')
      configTemplate.ssh.password = await read('ssh.password:')
      configTemplate.distPath = await read('distPath:')
      configTemplate.targetPath = await read('targetPath:')
      configTemplate.keepReleases = await read({
        prompt: 'keepReleases:',
        default: 10
      })
    }
    catch(e) {
      log.fail(e)
      return
    }

    const newConfig = Object.assign({
      [env]: configTemplate
    }, oldConfig)
  
    fs.writeFileSync(rcPath, JSON.stringify(newConfig, null, 2))
  
    log.success('配置生成成功！')
  }
}