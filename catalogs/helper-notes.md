# Translation Helper 补漏说明

无法在此环境里启动 Vortex GUI 把每个页面点一遍。本包用下面三层代替实机 Helper 扫漏：

1. 官方 v2.5.0 源码与 `locales/en` 静态抽取
2. 本机安装目录 `bundledPlugins`（`index.cjs`）与用户已装游戏
3. 已装社区包 `Chinese Translation for Vortex v1.13.7` 中由 Helper 累积的词条（约 3000 条额外 key）

这些 Helper 历史词条已并入 `zh/`。之后若要用官方 Helper 再补漏：

1. 安装 [Translation Helper](https://www.nexusmods.com/site/mods/28)
2. 选择中文后把主界面和已管理游戏点一遍
3. 把 `%AppData%\Roaming\Vortex\locales\zh` 新增词条合并回本仓库
