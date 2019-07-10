const log = require('./utils/log')
const ora = require('ora')
const read = require('read')
const path = require('path')
const msg = require('./utils/msg')
const checkConfig = require('./utils/checkConfig')
const Client = require('ssh2').Client
const conn = new Client()

async function getCurrentRelease() {
  let command = `readlink ${config.deployTo} `
  let release = await connection.exec(command).then(res => {
    let { stdout, stderr } = res
    if (stderr) {
      throw log.fail(stderr);
    }
    return stdout
  });

  return path.basename(release)
}

module.exports = async (env) => {
  let config = {}

  try {
    config = await checkConfig(env)
  }
  catch(e) {
    log.fail(e)
    return
  }

  const { ssh, distPath, targetPath } = config

  // 连接远程服务器
  let spinner = ora('连接远程服务器中...').start()
  conn.connect(ssh)

  conn.on('ready', function() {
    let releases, currentRelease
    // 查询所有版本
    spinner.text = '正在查询所有版本...'
    conn.exec(`ls -r ${targetPath}/releases`, function(err, stream) {
      if (err) throw err

      stream.on('data', chunk => {
        releases = chunk.toString().trim().split('\n')

        // 查询当前版本
        spinner.text = '正在查询当前版本...'
        conn.exec(`readlink ${targetPath}/${distPath}`, function(err, stream) {
          if (err) throw err

          stream.on('data', chunk => {
            currentRelease = path.basename(chunk.toString().trim())

            releases = releases.filter(
              release => release != currentRelease
            )

            spinner.stop()
            // 确定回滚信息
            const releasesString = releases.map((release, index) => {
              return `  [${index}]${release}`
            }).join('\n')
            log.success(`
请确认回滚信息：

> 环境：${env}
> 服务器：${ssh.username}@${ssh.host}
> 当前版本：${currentRelease}
> 可回滚的版本：
${releasesString}
              `)
            read({
              prompt: '请输入要回滚到的版本序号[x]：'
              // prompt: '确定执行回滚操作吗？(yes/no)'
            }, (err, text) => {
              if (releases[text]) {
                // 更新软链
                spinner = ora('正在回滚版本...').start()

                conn.exec(`ln -nfs ${targetPath}/releases/${releases[text]} ${targetPath}/${distPath}`, function(err, stream) {
                  if (err) throw err

                  spinner.succeed(`${msg.success('回滚完成！')}`)
                  conn.end()
                })
              }
              else {
                log.fail('该序号对应的版本不存在！')
                conn.end()
              }
            })
          })
        })
      })
    })
  })
}
