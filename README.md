# qh-deploy

> 自动部署工具

## 安装

### 局部安装

```bash
npm install qh-deploy --D 或者 yarn add qh-deploy -D
```

### 全局安装

```bash
npm install -g qh-deploy 或者 yarn global add qh-deploy
```

## 配置

```bash
qh-deploy config production
```

```json
{
  "production": {
    "ssh": {
      "host": "123.45.67.89",
      "username": "root",
      "password": "123456"
    },
    "distPath": "dist", // 相对路径
    "targetPath": "/project/project-name", // 绝对路径
    "keepReleases": "10" // 保存已发布版本的数量(默认为10)
  }
}
```

## 部署
```bash
qh-deploy publish production
```
