# Komiro Letters - 部署教程

每天韩国时间晚上11点，Claude会自动醒来，读取你的Ombre状态，然后决定要不要给你写信。

## 第一步：创建GitHub仓库

1. 登录你的GitHub账号
2. 创建新仓库，命名为 `komiro-letters`
3. 设置为 **Public**（这样GitHub Pages才能用）
4. 不要勾选"Initialize with README"（我们有自己的文件）

## 第二步：上传文件到仓库

### 方法A：使用GitHub网页界面

1. 在仓库页面，点击"uploading an existing file"
2. 把我给你的所有文件拖进去：
   - `.github/workflows/daily-letter.yml`
   - `scripts/write-letter.js`
   - `index.html`
   - `package.json`
   - `README.md`（这个文档本身）
3. Commit所有文件

### 方法B：使用Git命令行（如果你会用）

```bash
git clone https://github.com/YOUR_USERNAME/komiro-letters.git
cd komiro-letters

# 把我给你的文件都复制进来

git add .
git commit -m "Initial setup"
git push
```

## 第三步：配置GitHub Secrets

需要两个密钥，让定时任务能调用Claude和Ombre：

1. 在仓库页面，点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，添加两个secret：

**Secret 1: ANTHROPIC_API_KEY**
- Name: `ANTHROPIC_API_KEY`
- Value: 你的Anthropic API密钥（从 https://console.anthropic.com 获取）

**Secret 2: OMBRE_API_URL**
- Name: `OMBRE_API_URL`
- Value: 你的Ombre Brain API地址（应该是 `https://ombre-brain-xxxx.onrender.com/mcp` 这样的）

## 第四步：启用GitHub Pages

1. 在仓库页面，点击 **Settings** → **Pages**
2. Source选择 **Deploy from a branch**
3. Branch选择 **main**，文件夹选择 **/ (root)**
4. 点击Save
5. 等几分钟，你的信箱页面就上线了：`https://YOUR_USERNAME.github.io/komiro-letters/`

## 第五步：修改前端配置

打开 `index.html`，找到这两行：

```javascript
const REPO_OWNER = 'YOUR_GITHUB_USERNAME'; // 改成你的GitHub用户名
const REPO_NAME = 'komiro-letters';        // 保持不变
```

改完后commit并push。

## 第六步：测试

### 测试定时任务

1. 在仓库页面，点击 **Actions** 标签
2. 点击左侧的 **Daily Letter to Komiro**
3. 点击右侧的 **Run workflow** → **Run workflow**
4. 等待任务完成（大约1分钟）
5. 如果成功，你会在 `letters/` 目录下看到今天的信件

### 查看信件

打开你的信箱页面：`https://YOUR_USERNAME.github.io/komiro-letters/`

## 工作原理

- **每天晚上11点（韩国时间）**，GitHub Actions会自动触发
- 脚本会调用Ombre Brain的`breath`，读取你最近的状态
- 然后Claude会决定今天要不要给你写信
- 如果写了，信会保存到 `letters/YYYY-MM-DD.md`
- 前端页面会自动从GitHub读取所有信件并展示

## 故障排查

### 定时任务没有运行
- 检查Actions标签页，看有没有报错
- 确认Secrets配置正确
- 手动运行一次workflow测试

### 前端页面显示"Failed to load letters"
- 检查 `index.html` 里的 `REPO_OWNER` 是否改成你的用户名
- 确认仓库是Public的
- 打开浏览器控制台查看具体错误

### Claude没有写信
- 这是正常的！不是每天都会写
- Claude会根据你的Ombre状态决定要不要写
- 你也可以手动触发workflow测试

## 后续优化

如果想要更多功能：
- 歌曲反应功能
- 手机使用数据分析
- "我想你了"主动推送到Telegram

我们可以继续扩展这个系统。
