# Chinese Translation for Vortex Remake

Vortex 2.5.0 简体中文翻译扩展。按官方 i18n 双轨格式（英文原文 key + 命名空间嵌套 key）和 [Translations 打包规范](https://github.com/Nexus-Mods/Vortex/wiki/MODDINGWIKI-Developers-General-Packaging-an-extension) 制作。

仓库：https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake

作者：SZMY-haruhi、Grok

## 安装

安装文件在 [Releases](https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake/releases)，不在仓库源码目录里。现在只能走 GitHub 手动安装。Nexus Mods 还没上传，Vortex 的「Find more」列表里也还搜不到这个包。

1. 打开 [Releases](https://github.com/SZMY-haruhi/Chinese-Translation-for-Vortex-Remake/releases/latest)，下载 `Chinese-Translation-for-Vortex-2.5.0.zip`。不要解压后再自己打一层文件夹。
2. 打开 Vortex → **Extensions**。
3. 把 zip 拖到页面下方的安装区域；或点那个区域，在「Select extension file」里选这个 zip。
4. 打开 **Settings → Interface → Language**，选择中文。
5. 若界面没立刻变成中文，重启 Vortex。

压缩包根目录必须是 `readme.txt` + `zh/`。

若还装着旧的 1.13.7 中文扩展，先在 Extensions 里关掉它，避免两套翻译叠在一起。

## 出现在 Vortex 扩展列表

Vortex 内置的「Find more」只收录 [nexusmods.com/site](https://www.nexusmods.com/site) 上、分类为 **Vortex > Translations**、并且通过官方审核的包。GitHub Release 不会自动出现在 Vortex 里。

要给别人从 Vortex 里一键安装，需要用你的 Nexus 账号新建一个 **site** 页（不要覆盖 [旧项目 mods/29](https://www.nexusmods.com/site/mods/29)），Main Files 只上传这一个 zip，版本号填 `2.5.0`，再提交审核。翻译类审核一般最多约 4 天。

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
