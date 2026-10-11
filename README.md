<div align="center">

# 墨卷 · InkRoll

<p align="center">
  <strong>墨下生花，一卷成图 —— 专为优雅阅读而生的出版级 Markdown 卡片与长图排版工具</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL_3.0-blue.svg?style=flat-square" alt="AGPL 3.0 License" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Runtime-Bun-black.svg?style=flat-square&logo=bun" alt="Bun" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/UI-React_19-61DAFB.svg?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript" alt="TypeScript" /></a>
</p>

</div>

---

## 🌟 为什么选择墨卷？

日常在社交媒体、知识库或社群分享技术笔记与随笔思考时，普通的截图往往充满生硬的工业黑体、断行错乱与刺眼的冷白背景。

**墨卷 (InkRoll)** 汲取传统纸质出版物美学与现代排版设计，将纯文本 Markdown 一键转化为极具温度与人文质感的图文卡片与长图。

```
  Markdown 随笔/笔记 ────────►    墨卷排版引擎    ────────► 视网膜级卡片 / 长图
 (文字 · 公式 · 图表)          (温润纸质排版 · 规整分流)        (小红书 · 朋友圈 · 幻灯片)
```

---

## ✨ 核心特性

| 特性 | 说明 |
| :--- | :--- |
| 📜 **Kami 和纸美学** | 采用沉稳墨水蓝强调色、温润和纸底色，配合严谨的衬线字体排版体系（Charter / Georgia / 霞鹜文楷 / 思源宋体），告别生硬工业黑体。 |
| 📐 **多场景画幅适配** | 内置小红书黄金图文 (3:4)、朋友圈与九宫格 (1:1)、幻灯片与宽屏 (16:9)、手机海报 (9:16) 及无限延展卷轴长图，精准契合主流平台画幅。 |
| ⚡ **3x 视网膜超清导出** | 高精度光栅化渲染，锁定 3x 视网膜级超清无损 PNG 输出，无任何压缩模糊噪点；支持一键复制到系统剪贴板。 |
| 🧮 **全离线公式与图表** | 全离线 KaTeX 数学公式渲染（零网络外链依赖，彻底防范导出白屏）+ Mermaid 流程图与时序图原生解析支持。 |
| 🔒 **纯本地离线隐私** | 所有文字解析与图像渲染均在浏览器本地完成，内容绝不上云，纯粹、安全且私密。 |
| 🎛️ **克制精细的排版控制** | 支持实时调节字号、行距、内边距、圆角与主题，提供优雅的水印签名配置。 |

---

## 🎨 精选排版主题

墨卷内置针对不同阅读场景精细调校的 8 款主题体系：

* **Kami 和纸 (Kami Paper)**：*推荐*，受 tw93/Kami 启发的出版物美学，沉稳墨水蓝搭配温润和纸底色与柔和水彩染高亮。
* **经典纯白 (Classic White)**：极简干净、现代高可读性的通用纯白排版。
* **暖调纸张 (Warm Paper)**：柔和护眼、适合长篇随笔与读书摘抄。
* **松墨黛绿 (Forest Paper)**：深沉雅致的东方古典色调。
* **柔蓝印记 (Blue Note) / 淡雅薰衣草 (Lavender)**：轻快明亮、适合现代年轻化内容传播。
* **极简暗黑 (Dark Night) / 翡翠深邃 (Emerald Dark)**：专为夜间与代码块干货打造的深色视界。

---

## 💻 本地构建

如需在本地运行或构建本项目，请确保环境中已安装 [Bun](https://bun.sh)：

```sh
# 安装依赖
bun install

# 启动本地 Web 开发服务 (http://localhost:5173)
bun run dev:web

# 构建生产版本
bun run build:web
```

---

## 📄 开源许可证

本项目基于 **AGPL-3.0** 开源许可证分发，核心排版引擎模块遵循 **MPL-2.0** 许可证。详情请参阅 [LICENSE](./LICENSE)。

---

## 🙏 致敬与鸣谢 (Credits)

* 🎨 **[tw93/Kami](https://github.com/tw93/kami)**：墨卷的和纸主题、沉稳墨水蓝强调色及克制出版物排版哲学深受 tw93 探索的启发。在此致敬！
* 📐 **[KaTeX](https://katex.org/)** & **[markdown-it](https://github.com/markdown-it/markdown-it)**：提供强大的底层数学公式与标记语言解析基石。
* 📊 **[Mermaid](https://mermaid.js.org/)**：为卡片排版提供优雅的图表渲染支持。
