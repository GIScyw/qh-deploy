const Client = require('ssh2').Client;
const path = require('path')
const fs = require('fs')
const log = require('./utils/log')
const msg = require('./utils/msg')
const checkConfig = require('./utils/checkConfig')
const ora = require('ora')
const read = require('read')

const conn = new Client()
const releaseDirName = getReleaseDirName()

module.exports = async (env) => {
  let config = {}

  try {
    config = await checkConfig(env)
  }
  catch(e) {
    log.fail(e)
    return
  }

  const { ssh, distPath, targetPath, keepReleases = 10 } = config

  log.success(`
请确认发布信息：

> 环境：${env}
> 服务器：${ssh.username}@${ssh.host}
> 待发布文件夹：${config.distPath}
> 服务器发布路径：${config.targetPath}
  `)

  read({
    prompt: '确定执行发布操作吗？(yes/no)'
  }, (err, text) => {
    if (text == 'yes') {
      // 连接远程服务器
      const spinner = ora('连接远程服务器中...').start()


      conn.connect(ssh)

      conn.on('ready', function() {
        const { fileList, dirList } = getAllPath(distPath)
        const targetDirPaths = dirList.map(dir => targetPath + `/releases/${releaseDirName}` + dir.replace(distPath, '')).join(' ')

        // 创建文件夹
        spinner.text = '正在创建文件夹...'
        conn.exec(`mkdir -p ${targetDirPaths}`, function(err, stream) {
          if (err) throw err

          // 传输文件
          spinner.text = '正在传输文件...'
          conn.sftp(function(err, sftp) {
            if (err) throw err

            putfiles(sftp, fileList, distPath, targetPath).then(() => {

              // 更新软链接
              spinner.text = '正在更新软链...'
              conn.exec(`ln -nfs ${targetPath}/releases/${releaseDirName} ${targetPath}/${distPath}`, function(err, stream) {
                if (err) throw err

                // 清除旧版本
                spinner.text = '正在清理历史版本...'
                conn.exec(`(ls -rd ${targetPath}/releases/*|head -n ${keepReleases};ls -d ${targetPath}/releases/*)|sort|uniq -u|xargs rm -rf`, function(err, stream) {
                  if (err) throw err

                  spinner.succeed(`${msg.success('部署完成！')}`)
                  conn.end()
                })
              })
            })
          })
        })
      })
    }
  })
}

// 获取所有文件/文件夹的相对路径
function getAllPath(distPath) {
  const dirList = []
  const fileList = []

  function mapDir(dir) {
    const list = fs.readdirSync(dir)
    list.forEach(item => {
      const itemPath = dir + '/' + item
      if (fs.statSync(itemPath).isDirectory()) {
        dirList.push(itemPath)
        mapDir(itemPath)
      }
      else {
        fileList.push(itemPath)
      }
    })
  }

  mapDir(distPath)

  return {
    dirList,
    fileList
  }
}

/**
 *
 * @param {*} sftp
 * @param {*} fileAbsolutePath 待上传文件的绝对路径
 * @param {*} remoteFileAbsolutePath 上传到远程服务器的文件绝对路径
 */
function putfile(sftp, fileAbsolutePath, remoteFileAbsolutePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(fileAbsolutePath, remoteFileAbsolutePath, function(err) {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })
}

/**
 *
 * @param {*} sftp
 * @param {*} fileList 待上传的文件列表[文件的相对路径]
 * @param {*} distPath 待上传的文件夹路径(相对路径)
 * @param {*} targetPath 远程服务器的文件夹路径(绝对路径)
 */
async function putfiles(sftp, fileList, distPath, targetPath) {
  for (let index = 0; index < fileList.length; index++) {
    const fileRelativePath = fileList[index]
    const fileAbsolutePath = path.resolve(fileRelativePath)
    const remoteFileAbsolutePath = targetPath + `/releases/${releaseDirName}` + fileRelativePath.replace(distPath, '')

    await putfile(sftp, fileAbsolutePath, remoteFileAbsolutePath)
  }
}

function getReleaseDirName() {
  const now = new Date()
  let YY = now.getFullYear()
  let MM = now.getMonth() + 1
  let DD = now.getDate()
  let hh = now.getHours()
  let mm = now.getMinutes()
  let ss = now.getSeconds()

  YY = String(YY).slice(2)
  MM = MM < 10 ? '0' + MM : MM
  DD = DD < 10 ? '0' + DD : DD
  hh = hh < 10 ? '0' + hh : hh
  mm = mm < 10 ? '0' + mm : mm
  ss = ss < 10 ? '0' + ss : ss

  return `${YY}${MM}${DD}${hh}${mm}${ss}`
}
