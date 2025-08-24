## 快速部署步骤

### 1. 准备仓库
```bash
# 在 GitHub 上创建新仓库，然后克隆到本地
git clone https://github.com/yourusername/music-visualizer.git
cd music-visualizer

# 复制项目文件到仓库
# 确保包含以下文件：
# - client/ (前端代码)
# - vite.config.github.ts
# - .github/workflows/deploy.yml
# - README.md
```

### 2. 修改配置
在 `vite.config.github.ts` 中，如果使用自定义仓库名，需要修改 `base` 配置：
```js
export default defineConfig({
  base: '/your-repo-name/', // 改为你的仓库名
  // ... 其他配置
})
```

### 3. 构建命令
```bash
# 安装依赖
npm install

# 构建静态文件
vite build --config vite.config.github.ts

# 本地预览
vite preview --config vite.config.github.ts --port 4173
```

### 4. GitHub Pages 设置
1. 进入 GitHub 仓库设置页面
2. 找到 "Pages" 选项
3. 选择 "GitHub Actions" 作为部署源
4. 提交代码到 main 分支，自动部署将开始

### 5. 访问网站
部署完成后，可通过以下地址访问：
```
https://yourusername.github.io/your-repo-name/
```

## 技术说明

### 为什么能部署到 GitHub Pages？
- 移除了服务器端依赖（Express、数据库等）
- 转换为纯前端 React 应用
- 使用 Web Audio API 进行音频处理
- 所有功能都在浏览器端实现

### 功能保留情况
✅ **完全保留的功能**:
- 本地文件上传和播放
- 四种可视化模式
- 颜色主题切换
- 全屏模式
- 响应式设计
- URL 音频播放

### 部署后的特性
- 🚀 快速加载（静态文件）
- 📱 移动端友好
- 🎨 所有视觉效果保持完整
- 🎵 支持所有音频格式

## 故障排除

### 构建失败
```bash
# 检查 Node.js 版本 (需要 18+)
node --version

# 清除缓存后重新安装
rm -rf node_modules package-lock.json
npm install
```

### 部署失败
1. 检查 GitHub Actions 日志
2. 确保 Pages 权限已启用
3. 检查仓库是否为公开或有 GitHub Pro

### 音频播放问题
- 某些 CORS 限制可能影响网络 URL 播放
- 建议使用支持 CORS 的音频文件链接
- 本地文件上传不受影响