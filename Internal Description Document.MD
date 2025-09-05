Sonoria | 音境
> 动人心绚，听音之境。
> Your sound, reimagined.
> 
目录 (Table of Contents)
 * 项目概览
 * 快速上手
 * 文件与目录结构
 * 核心技术架构
 * 核心概念与变量
 * 未来开发与路线图
 * 如何贡献
 * 已知问题与故障排除
 * 联系与支持
1. 项目概览 (Project Overview)
Sonoria 是一个基于 Web 的音乐可视化应用，旨在将音频数据转化为沉浸式动态视觉效果。项目核心理念是将“声音的境界”具象化，通过极简的界面和富有生命的视觉效果为用户提供独特的感官体验。
该项目采用高度模块化的前端架构，将核心应用逻辑与各个可视化主题完全解耦，以确保高度的可维护性和可扩展性。
2. 快速上手 (Getting Started)
前提条件
 * 一个现代浏览器 (推荐 Chrome, Firefox 或 Safari)。
 * 代码编辑器 (如 VS Code)。
运行项目
 * 将整个项目文件夹克隆或下载到本地。
 * 在浏览器中打开 index.html 文件即可运行。
3. 文件与目录结构 (File & Directory Structure)
sonoria-app/
├── index.html          // 应用入口，包含 UI 元素和脚本引用
├── style.css           // 全局样式表，负责 UI 布局和视觉风格
├── script.js           // **核心应用逻辑**，负责音频处理、状态管理和主题切换
└── visualizations/     // 可视化主题模块目录
    ├── particles.js    // “粒子”主题的渲染逻辑
    ├── bars.js         // “音频柱”主题的渲染逻辑
    └── vortex.js       // “漩涡”主题的渲染逻辑

 * index.html: 包含所有 UI 元素，如播放按钮、文件输入框和主题切换按钮。所有 JavaScript 文件均在此处按正确的顺序引用。
 * style.css: 定义了所有元素的样式，特别是按钮的磨砂玻璃效果和应用的“呼吸”动画。
 * script.js: 这是一个高度抽象的核心文件。它不包含具体的渲染逻辑，而是通过一个主题管理器对象（visualizations）来动态调用当前选定的可视化主题函数。它还负责与 Web Audio API 交互，处理音频流数据，并更新应用状态。
 * visualizations/: 这是项目的可扩展性核心。每个文件都是一个独立的模块，包含其自身的渲染函数。未来添加新主题时，只需在此处创建新文件并将其注册到 script.js 中的 visualizations 对象即可。
4. 核心技术架构 (Technical Architecture)
P5.js
 * 用途: 作为应用的图形渲染引擎。P5.js 简化了画布操作，使得创建动态视觉效果变得非常高效。
 * 集成: setup() 和 draw() 函数是 p5.js 的核心。script.js 的 draw() 函数中，我们根据当前主题动态调用 visualizations 模块中的渲染函数，实现了视觉与逻辑的分离。
Web Audio API
 * 用途: 用于底层音频处理和实时频谱分析。AnalyserNode 是核心，它能提供音频流的频率和时域数据。
 * 数据: 我们主要使用 getByteFrequencyData() 方法获取音频的频率数据（dataArray），并从中提取出低频（Bass）、**中频（Mids）和高频（Treble）**数据，用于驱动不同的视觉效果。
模块化可视化模式
这是一个关键的设计模式。
 * 在 script.js 中定义一个全局的 visualizations 对象。
 * 每个主题文件（例如 particles.js）都向该对象添加一个方法，例如 visualizations.particles = function() { ... }。
 * script.js 维护一个 currentTheme 变量，并动态地调用 visualizations[currentTheme] 来渲染当前选定的效果。
这种模式使我们可以轻松地添加、修改或删除任何可视化主题，而无需修改核心逻辑。
5. 核心概念与变量 (Core Concepts & Variables)
 * audioData：一个包含 energy、bass、mids、treble 和 bpm 等实时音频数据的对象。所有可视化效果都依赖于此数据。
 * pulseFactor：根据音频的低频能量计算得出的平滑脉冲值，用于创建 UI 元素和视觉效果的“呼吸”效果。
 * currentVisualEnergy：音频能量的平滑值，用于控制粒子速度等视觉元素的整体动态范围。
 * baseColor：当前选定的色彩主题的 HSL 颜色数组，所有视觉效果都基于此颜色进行渲染。
6. 未来开发与路线图 (Future Development & Roadmap)
 * 增加更多可视化主题: 欢迎团队成员开发新主题，只需在 visualizations 文件夹中创建新文件并添加一行注册代码即可。
 * 音频文件拖放功能: 增加对文件拖放的支持，进一步优化用户体验。
 * 动态色彩主题: 探索根据音频流（如情绪或主旋律）动态生成或调整色彩主题的功能。
 * 移动端手势优化: 为移动设备添加更直观的滑动和触摸手势控制。
7. 如何贡献 (How to Contribute)
 * 克隆项目仓库。
 * 创建一个新分支进行开发。
 * 确保代码符合现有的代码风格。
 * 提交拉取请求（Pull Request），详细描述您的更改和新增功能。
8. 已知问题与故障排除 (Known Issues & Troubleshooting)
 * iOS 无法上传音频文件: iOS Safari 对 accept="audio/*" 的支持不完善。已通过将 accept 属性更改为 .mp3, .wav, .aac, .m4a, .mp4 修复。
 * 远程 URL 播放失败: 可能由于 CORS（跨域资源共享）问题。请确保远程音频服务器已正确配置 CORS 头部。
 * 无法加载任何音频: 检查浏览器是否已授予访问音频的权限。
9. 联系与支持 (Contact & Support)
如有任何问题、Bug 报告或功能建议，请联系 [huangxianfan@gmail.com/元觉智能]。
