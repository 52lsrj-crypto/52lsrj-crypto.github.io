# 图片放置指南（建议遵守版权/许可）

你需要准备真实的枫树与枫叶 PNG/JPG 图片，并放入如下目录与文件名（也可更改，但请同步修改 `main.js` 里的路径）：

推荐目录结构：
```
assets/
└─ maple/
   ├─ tree-spring.jpg
   ├─ tree-summer.jpg
   ├─ tree-autumn.jpg
   ├─ tree-winter.jpg
   └─ leaves/
      ├─ leaf-spring-1.png
      ├─ leaf-spring-2.png
      ├─ leaf-summer-1.png
      ├─ leaf-summer-2.png
      ├─ leaf-autumn-1.png
      ├─ leaf-autumn-2.png
      ├─ leaf-autumn-3.png
      └─ leaf-winter-1.png   （可选，冬季通常设为无叶）
```

要求与建议：
- 背景树图：比例接近 16:9 或 4:3 的大图（≥1920×1080），JPG 即可。主体为“枫树”，四季各一张。
- 叶子图：透明背景 PNG，尽量裁剪紧凑，单片叶子为佳。建议每季 1～3 张，颜色符合季节（春浅绿、夏墨绿、秋红/橙/黄、冬褐色或无）。
- 命名不强制，修改后同步 `main.js` 里的路径（SEASON_CONFIG）。

图片来源（可合法使用的公共资源，非商业亦建议遵守许可）：
- Unsplash（免费可商用但需遵循其许可条款）： https://unsplash.com/s/photos/maple-tree
- Pexels（免费可商用）： https://www.pexels.com/search/maple%20tree/
- Wikimedia Commons（需注意各自条款/作者署名）： https://commons.wikimedia.org/wiki/Category:Maple_leaves
- 公共领域/CC0 资源库（如 Pixabay）： https://pixabay.com/images/search/maple%20leaf/

小技巧：
- 叶子 PNG：优先选择纯色背景原图，抠图后导出为透明 PNG；或直接搜索 “maple leaf png transparent”。
- 性能：叶子 PNG 尺寸控制在短边 128～512px，体积尽量 <200KB；背景 JPG 使用图片压缩。
- 若你使用 GitHub Pages，请将以上目录与三个代码文件上传到你的仓库（如 52lsrj-crypto/52lsrj-crypto.github.io）的根目录即可访问。