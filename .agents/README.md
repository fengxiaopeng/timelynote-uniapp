# uni-app Skills 目录

不要一次全部加载，根据当前任务场景查找下表，只导入对应的 skill（读取其 `SKILL.md`），再按其中指引加载 references/examples。

大部分AI IDE 默认支持 skills目录，不识别可以在 `.claude/skills`等目录下引用该目录文件，用于指引 AI 搜索。

所有技能统一放在 `.agents/skills/`，根据任务按需读取。项目不使用 uniCloud 云开发，相关技能已移除。

## 按需导入速查表

| 任务场景 | 导入 skill | 路径 |
|---|---|---|
| uni-app 框架基础（项目结构、条件编译、pages.json/manifest.json 配置） | `uni-app` | `./skills/uni-app/SKILL.md` |
| uni-app 内置组件 / uni-ui 组件 / 各类 API（网络、存储、设备等），逐组件逐 API 示例 | `uniapp-project` | `./skills/uniapp-project/SKILL.md` |
| 一条命令创建 uni-app 新项目（CLI / HBuilderX） | `uniapp-project-creator` | `./skills/uniapp-project-creator/SKILL.md` |
| uni-app 小程序平台配置、组件与 API 兼容性 | `uniapp-mini-guide` | `./skills/uniapp-mini-guide/SKILL.md` |
| 小程序/App 打包发布、平台限制 | `uniapp-mini-guide` | `./skills/uniapp-mini-guide/SKILL.md` |
| uni-app 离线打包为原生 Android/iOS App（签名、证书、原生配置） | `uniapp-native-app` | `./skills/uniapp-native-app/SKILL.md` |
| 开发 uni-app 原生插件（Android/iOS 原生模块、插件通信、发布） | `uniapp-native-plugin` | `./skills/uniapp-native-plugin/SKILL.md` |
| 插件市场浏览、自动安装插件、第三方插件集成 | `uniapp-plugin` | `./skills/uniapp-plugin/SKILL.md` |
| uni-ad 广告变现（banner/激励视频/插屏等广告类型与事件） | `uniapp-ad` | `./skills/uniapp-ad/SKILL.md` |
| 在 uni-app 中集成 uCharts 图表 | `uniapp-ucharts` | `./skills/uniapp-ucharts/SKILL.md` |
| 在 uni-app 中集成 uView UI 组件库 | `uniapp-uview` | `./skills/uniapp-uview/SKILL.md` |
| uView Pro（Vue 3 版）组件、工具、布局模板 | `uview-pro-vue3` | `./skills/uview-pro-vue3/SKILL.md` |
| uni-app-x 内置组件 / API（Vue 3 + TS + Vite，UTS） | `uniappx-project` | `./skills/uniappx-project/SKILL.md` |
| 一条命令创建 uni-app-x 新项目 | `uniappx-project-creator` | `./skills/uniappx-project-creator/SKILL.md` |
| 在 uni-app-x 中集成 uView Pro | `uniappx-uview-pro` | `./skills/uniappx-uview-pro/SKILL.md` |

## 导入规则

1. **先匹配场景，再导入**：只读取命中场景的 `SKILL.md`，不预加载整个目录。
2. **一个任务可能命中多个 skill**：例如「uni-app 项目里用 uView 做图表」→ `uniapp-project` + `uniapp-uview`（+ `uniapp-ucharts` 若涉及图表）。逐个按需导入。
3. **优先级**：本项目（unibest）是 uni-app + Vue3 + Vite 项目，日常开发默认命中 `uni-app` / `uniapp-project`；涉及 uni-app-x 的 skill 仅在明确开发 uni-app-x 时导入。
4. **skill 内部同样按需加载**：`SKILL.md` 只是指引，其 references/、examples/、api/ 子文件按当前具体问题再读取，避免上下文膨胀。

## 区分易混淆项

- `uniapp-uview` vs `uview-pro-vue3` vs `uniappx-uview-pro`：分别对应 uView 1.x/2.x（uni-app）、uView Pro（Vue 3）、uView Pro（uni-app-x）。按项目技术栈选择。
- `uniapp-project-creator` vs `uniappx-project-creator`：创建 uni-app 项目用前者，创建 uni-app-x（UTS）项目用后者。
