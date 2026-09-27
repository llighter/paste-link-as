# Paste Link As

[English](README.md) | [한국어](README.ko.md) | **简体中文** | [日本語](README.ja.md) | [Español](README.es.md) | [Français](README.fr.md)

粘贴 URL 后，选择它在笔记中的呈现方式：带标题的链接、行内提及或链接卡片。所有内容都以普通 Markdown 保存，即使没有这个插件，笔记也照样可读。

![笔记中的提及和链接卡片](screenshot/sample1.png)

## 使用方法

在笔记中粘贴 URL，它会立即以 `[标题](url)` 的形式插入，并在下方弹出一个小菜单：

- **保持**：保留为带标题的链接。
- **提及**：在一行中显示网站图标、网站名称和标题，过长时以 … 截断。
- **卡片**：显示缩略图、标题、两行描述，以及网站图标和链接地址。

用 ↑/↓ 选择，按 Enter（或 Tab）确认，按 Esc 关闭。想忽略菜单，继续输入即可；在 **保持** 上按 Enter 会像平常一样换行。

![粘贴 YouTube URL：先插入带标题的链接，再通过菜单变为提及和卡片](screenshot/sample2.gif)

[观看 MP4 演示](screenshot/sample2.mp4)

笔记中已有的 URL 也可以转换。选中它（纯 URL 或 `[标题](url)` 链接），然后运行命令：

- **将链接转为卡片**
- **将链接转为提及**

未选中任何内容时，命令会使用剪贴板中的 URL；剪贴板中也没有时，会请你输入。插件不设置默认快捷键，请在 Obsidian 设置的快捷键中自行指定。

菜单、命令和设置会跟随 Obsidian 的语言：英语、韩语、简体中文、日语、西班牙语或法语。繁体中文显示为简体中文，其他语言显示为英语。

## 写入的内容

**保持** 会留下带标题的链接：

```md
[The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
```

提及是普通的 Markdown 链接。对于 YouTube 视频，网站名称的位置显示的是频道名称：

```md
[![|16](favicon-youtube.com.png) *频道名称* The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
```

卡片是 `[!link]` 标注框（callout）：

```md
> [!link] [The Odyssey | Official Trailer](https://www.youtube.com/watch?v=Mzw2ttJD2qQ)
> ![[link-youtube.com-h5vbt4.jpg]]
>
> The Odyssey - In Theaters 07.17.26…
>
> ![[favicon-youtube.com.png|16]] https://www.youtube.com/watch?v=Mzw2ttJD2qQ
```

没有插件专用的语法。关闭插件后，提及显示为普通链接，卡片显示为普通标注框，只是样式消失。

点击卡片或提及的任何位置都会打开链接。在实时预览中编辑卡片时，请从卡片下一行把光标移进去。

## 不处理粘贴的情况

以下情况下菜单不会弹出，粘贴照常进行：

- 剪贴板中不是单个 URL，或者是图片 URL；
- 在链接地址（`](`）中、紧跟在引号、`<` 或 `[` 之后、代码中或属性中粘贴；
- 处于离线状态。

选中文字后粘贴 URL，会把选中的文字变为链接：`[选中的文字](url)`。

在列表、引用和表格中，菜单没有 **卡片** 选项，因为卡片是多行的标注框。

## 设置

- **图片文件夹**：缩略图和网站图标的保存位置。留空则使用 Obsidian 设置中的附件位置。

## 网络使用

粘贴 URL 或运行命令时，插件会直接向该网站请求页面，以读取标题、描述、图片和网站图标。创建卡片和提及时，会从该网站下载图片和网站图标并保存到你的库中。插件不会连接其他任何远程服务，不会把笔记中的任何内容发送到别处，也没有遥测。

## 保存的文件

- 网站图标：`favicon-<域名>.<扩展名>`，每个域名一个。`.ico` 等 Obsidian 无法显示的格式会转换为 PNG。
- 缩略图：`link-<域名>-<哈希>.<扩展名>`。

已有的文件会被重复使用，因此粘贴同一网站的其他链接时，不会再次下载网站图标。

## 样式

`styles.css` 只作用于卡片（`[!link]` 标注框）和提及（包含 16px 图片和斜体网站名称的链接）。其他链接和图片保持主题原样。如需调整外观，请在 CSS 代码片段中覆盖这些选择器。

标题粗细由 `--paste-link-as-title-weight` 决定（默认 500）。如需修改，可添加 CSS 代码片段，例如 `body { --paste-link-as-title-weight: 600; }`。

## 限制

- 菜单打开时，↑/↓ 在菜单内移动。要移动光标，请先按 Esc。
- 在实时预览中，包含提及的行在光标移入之前会保持为一行，并以 … 结尾。该行的其他文字也会一起被截断。
- 包含 16px 宽图片和斜体文字的链接会显示为提及，类型为 `link` 的标注框会显示为卡片。
- Auto Link Title 等同样会改写粘贴 URL 的插件，也会处理同一个粘贴事件。请关闭它们的粘贴处理功能，以免一次粘贴被处理两次。

## 安装

- **社区插件**：在 Obsidian 的社区插件中搜索 “Paste Link As”（上架后）。
- **手动安装**：从最新版本（release）下载 `main.js`、`manifest.json` 和 `styles.css`，放入 `<库>/.obsidian/plugins/paste-link-as/`，重新加载 Obsidian 后启用插件。

## 许可证

[MIT](LICENSE)
