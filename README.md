# 音律视界 - Music Visualization

绚丽多彩极具呼吸感的音乐可视化播放器

## 功能特性

🎵 **多种可视化模式**
- 波形图 (Waveform)
- 频谱柱状图 (Frequency Bars)  
- 粒子效果 (Particles)
- 圆形可视化 (Circular)

🎨 **丰富视觉效果**
- 4种颜色主题切换
- 呼吸动画效果
- 全屏播放模式
- 响应式设计

📁 **多种输入方式**
- 本地文件上传 (MP3, WAV, FLAC, AAC, OGG, M4A)
- 网络音频URL播放
- 拖拽上传支持

## 在线演示

[点击访问在线版本](https://yourusername.github.io/music-visualizer/)

## 本地运行

```bash
# 安装依赖
npm install

# 开发模式 (全栈)
npm run dev

# 静态版本构建 (GitHub Pages)
npm run build:static

# 预览静态版本
npm run preview
```

## 部署到 GitHub Pages

1. Fork 这个仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 GitHub Actions 作为部署源
4. 推送代码，自动部署完成！

## 技术栈

- **前端**: React + TypeScript + Vite
- **样式**: Tailwind CSS + shadcn/ui
- **音频处理**: Web Audio API
- **可视化**: Canvas API
- **状态管理**: TanStack Query

## License

MIT License