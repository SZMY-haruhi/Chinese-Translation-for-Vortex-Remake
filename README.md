# Chinese Translation for Vortex Remake

Vortex 2.5.0 简体中文翻译扩展。按官方 i18n 双轨格式（英文原文 key + 命名空间嵌套 key）和 [Translations 打包规范](https://github.com/Nexus-Mods/Vortex/wiki/MODDINGWIKI-Developers-General-Packaging-an-extension) 制作。

仓库：https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake

作者：SZMY-haruhi、Grok

## 安装

Nexus 页：[site/mods/2200](https://www.nexusmods.com/site/mods/2200)

1. 打开 Vortex → **Extensions** → **Find more**，搜索 `Chinese Translation for Vortex Remake` 并安装。审核通过前列表里可能还没有：到 [Nexus Files](https://www.nexusmods.com/site/mods/2200?tab=files) 或 [GitHub Releases](https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake/releases/latest) 下载 `Chinese-Translation-for-Vortex-2.5.0.zip`，拖到 Extensions 页下方安装区。
2. 不要解压后再自己打一层文件夹。压缩包根目录必须是 `readme.txt` + `zh/`。
3. 打开 **Settings → Interface → Language**，选择中文。
4. 若界面没立刻变成中文，重启 Vortex。
5. 若还装着旧的 1.13.7 中文扩展，先在 Extensions 里关掉它。

Vortex 的 Find more 要等 Nexus 审核翻译扩展，官方写的是最多约 4 天。过审前用上面的 zip 手动安装即可。

## 覆盖范围

- Vortex 2.5.0 核心界面：仪表盘、Mods、Downloads、Collections、Health Check、Settings、Extensions、Games、Profiles
- 随包装扩展中能抽到原文的命名空间
- 能对上原文的游戏扩展

[liuyanxi975/Chinese-Translation-for-Vortex](https://github.com/liuyanxi975/Chinese-Translation-for-Vortex) 仅作旧译记忆，不是本仓库骨架。

## 开发

```text
zh/          发布用中文语言文件
scripts/     抽词、对齐、署名、打包
catalogs/    对照表（已复用 / 待新译 / 已过期）
vendor/      本地克隆的官方源码与旧汉化，不提交
```

```powershell
node scripts/extract-strings.js
node scripts/match-old.js
node scripts/branding.js
node scripts/package.js
```

发布 zip 只包含 `readme.txt` 和 `zh/`。

## 许可证

[MIT](LICENSE)
