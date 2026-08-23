# RE Chinese Translation for Vortex

Vortex 2.5.0 简体中文翻译扩展。按官方 i18n 双轨格式（英文原文 key + 命名空间嵌套 key）和 [Translations 打包规范](https://github.com/Nexus-Mods/Vortex/wiki/MODDINGWIKI-Developers-General-Packaging-an-extension) 制作。

仓库：https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake

作者：SZMY-haruhi、Grok

## 安装

1. 下载发布包，在 Vortex 的 Extensions 页安装；或之后从 Nexus Mods 的 Vortex > Translations 获取。
2. 打开 Settings → Interface → Language，选择中文。
3. 若界面未立刻更新，重启 Vortex。

压缩包根目录必须是 `readme.txt` + `zh/`，不要再套一层文件夹。

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
