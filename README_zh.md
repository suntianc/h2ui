# h2ui

`h2ui` 是一个高效的命令行（CLI）工具，能够将高保真的静态 HTML 页面无缝转换为结构清晰、高可复用的 React 组件树（支持 TSX/JSX）。

它通过 **“静态规则分析 (AST Parsing) + LLM 语义增强”** 的混合架构，不仅能自动切分出合理的组件层次结构，还能完美提取并重组 CSS 样式，并提供所见即所得的本地热更新预览服务。

English Documentation: [README.md](./README.md)

---

## 设计初衷

为了打通 **创意 (Text) ➔ 设计 (HTML) ➔ 开发 (React)** 的核心链路：
- **核心痛点**：由于大多数 AI 模型无法根据创意直接生成高精度、一比一还原且符合规范的 React 多组件，直接由大模型产出 React 代码往往面临结构失真、代码碎片化和设计规范失控的风险。
- **天然优势**：相比之下，AI 模型非常擅长根据创意文本生成单页的高保真 HTML 页面。

`h2ui` 扮演了两者之间的编译器桥梁。它能够将高保真的静态 HTML 完美且规范地编译为生产级 React 组件，在 100% 还原视觉效果的同时，消除了 AI 直接生成 React 代码的规范风险。

---

## 核心特性

- **智能组件树切分**：自动识别 HTML 语义边界（如 `header`, `nav`, `main`, `footer` 及重复列表项），将扁平的 HTML 拆分为嵌套 of 组件树，并生成独立的 React 组件文件。
- **零配置样式提取与隔离**：
  - **CSS Modules**：默认将组件级专属样式生成为 `.module.css` 并自动绑定 `className`，提供绝对的样式隔离。
  - **共享样式去重 (Shared CSS)**：对多个组件中重复的内联样式进行智能去重并提取到 `shared.module.css`，在子组件中通过 `composes` 规则完美继承，避免冗余样式。
  - **全局样式兼容**：自动提取 HTML `<style>` 内的全局样式输出为 `global.css`，并在根组件顶部全局引入，规避类名被 Hash 导致全局样式失效。
- **外部资源无缝保留**：自动提取 HTML `<head>` 中的 `<link>` 资源（如 Google Fonts、外部 CDN 样式与图标等），在预览时完美加载。
- **实时热更新预览**：自带极速的 Vite 本地预览服务器，当你修改转换生成的文件时，浏览器预览会自动热重载。
- **LLM 语义化微调**：内置 LLM 接口支持，可自动为切分出的组件命名（如 `Header`, `FeatureCard`）并自动优化无用节点和事件绑定。

---

## 安装

通过 npm 进行全局安装：

```bash
npm install -g h2ui-cli
```

或者使用 `npx` 直接运行（无需手动安装）：

```bash
npx h2ui-cli convert <path-to-html-file>
```

如果是本地开发，请安装依赖并编译：

```bash
npm install
npm run build
```

---

## 命令行使用指南

> [!NOTE]
> 如果您是全局安装或通过 `npx` 运行，请直接使用可执行命令 `h2ui`。如果您是本地开发，请将 `h2ui` 替换为 `node dist/bin/h2ui.js`。

### 1. 初始化配置文件 (`init`)

生成 `.h2uirc` 配置文件 scaffold，用于定义你的个性化默认选项。

```bash
h2ui init [--force]
```

**默认配置文件示例 (`.h2uirc`)**：
```json
{
  "_comment": "h2ui configuration file.",
  "out": "./h2ui_output/",
  "typescript": true,
  "strict": false,
  "split": true,
  "cssMode": "module"
}
```

### 2. 转换静态 HTML (`convert`)

将 HTML 页面解析并转换为 React 组件：

```bash
h2ui convert <path-to-html-file> [options]
```

**常用选项：**
* `--out <directory>`：指定生成组件的输出目录（默认：`./h2ui_output/`）。
* `--type <tsx|jsx>`：输出文件的类型，支持 `tsx` 或 `jsx`（默认：`tsx`）。
* `--no-split`：禁用组件拆分，仅将整页转换为单个大组件文件。
* `--strict`：严苛模式，将转换过程中的全部警告（Warning）提升为错误并中断。
* `--llm <on|off>`：是否开启 LLM 语义优化模式（默认：`on`）。

**命令示例：**
```bash
h2ui convert verify-work/dashboard.html --out verify-work/output --llm on
```

### 3. 热更新实时预览 (`preview`)

启动本地预览服务器以实时浏览生成的组件效果：

```bash
h2ui preview [options]
```

**常用选项：**
* `-o, --out <dir>`：要监听和同步的转换输出目录（默认：`./h2ui_output`）。
* `-p, --port <port>`：预览服务器端口（默认：`5173`）。

**命令示例：**
```bash
h2ui preview --out verify-work/output --port 3000
```
启动后在浏览器中打开 `http://localhost:3000` 即可实时查看组件渲染效果。

---

## 样式提取规范 (CSS Extraction & Inheritance)

为了在生成的 React 代码中提供极致的可维护性，`h2ui` 在样式生成阶段遵循以下规范：

1. **全局样式标签**：
   HTML 中的全局 `<style>` 标签将提取并写入 `global.css`。在根组件中自动添加：
   ```tsx
   import './global.css';
   ```
2. **CDN 与外部字体**：
   原 HTML 中的外部引用链接（例如 Google Fonts、Tailwind 等）会在预览环境的 `index.html` 头部自动恢复加载。
3. **共享样式组合**：
   重复的内联样式属性移至 `shared.module.css` 中的 `.shared` 类，并在各个子组件专属的 `.module.css` 中利用 `composes` 规则加以组合：
   ```css
   .featureCard {
     composes: shared from './shared.module.css';
     /* 仅包含该组件特有的非共享样式 */
     background: blue; 
   }
   ```
   如果组件的所有样式都被提取到了共享样式中，仍会为其输出包含 `composes` 的 CSS 模块文件以确保 `import styles` 的引用链完整。

---

## 运行测试

使用 Vitest 进行单元测试：

```bash
npm test
```
