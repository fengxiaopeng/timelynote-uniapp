# 如期手记 · timelynote-uniapp

记录岁月，珍藏记忆。基于 unibest 4.4.1 的 uni-app 多端前端工程，面向微信小程序、Android/iOS App 和 H5。

技术栈：Vue 3、TypeScript、Vite 5、UnoCSS、Wot UI、Pinia、Vitest。保留模板的请求封装、登录状态与路由拦截能力；当前页面为项目起始页，账号与记录业务尚未接入，不会发送模拟登录请求。

## 首次启动

使用 Node.js 22.20.0（`.nvmrc`）和 pnpm 10.10.0。项目最低 Node 版本为 22.13.0。

```bash
corepack enable
corepack prepare pnpm@10.10.0 --activate
pnpm install --frozen-lockfile
cp env/.env.local.example env/.env.local
# 编辑 env/.env.local，填写自己的应用 ID
pnpm bootstrap
pnpm check
```

`pnpm bootstrap` 重置生成的 JSON 配置并执行一次微信小程序编译，生成页面配置和自动导入类型。首次安装、增加页面或自动导入 API 后，可先运行对应端的 dev/build，再进行类型检查。`src/pages.json`、`src/manifest.json` 和 `src/types/` 下声明由工具生成，请修改它们的配置源。

## 开发与构建

| 平台 | 开发 | 生产构建 | 构建产物 |
| --- | --- | --- | --- |
| H5 | `pnpm dev` | `pnpm build:h5` | `dist/build/h5` |
| 微信小程序 | `pnpm dev:mp` | `pnpm build:mp` | `dist/build/mp-weixin` |
| App | `pnpm dev:app` | `pnpm build:app` | `dist/build/app` |

H5 默认地址为 `http://localhost:9000`。微信开发者工具导入开发目录 `dist/dev/mp-weixin`；默认 `touristappid` 仅用于预览，真实登录与上传需要自己的 AppID。自动打开工具需要开启开发者工具的服务端口，可用 `SKIP_OPEN_DEVTOOLS=true pnpm dev:mp` 跳过。

App 构建生成 uni-app 资源，不是可安装的 APK/IPA。将 `dist/dev/app` 或 `dist/build/app` 导入 HBuilderX，继续运行到基座或原生打包；发行前填写自己的 DCloud AppID、包名、签名和所需原生模块配置。

## GitHub Pages 预览

在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。将本仓库的 Pages 工作流提交到 `master` 后，每次推送都会先执行质量检查，再构建并部署 H5；也可以在 **Actions → Deploy H5 to GitHub Pages → Run workflow** 手动触发。

部署成功后，在工作流的 `github-pages` 环境中点击访问链接。未配置自定义域名时，本仓库的默认地址为 `https://fengxiaopeng.github.io/timelynote-uniapp/`，仅在部署成功后可用。后续可直接通过这个链接查看已推送到 `master` 的最新页面，无需本地运行。

工作流从 Pages 设置读取部署子路径，并使用 hash 路由，支持刷新和直接打开页面。Pages 网站内容会公开展示，请勿将私密数据或凭证放入前端；真实后端仍需另行配置。此工作流发布 `master` 的版本，不为每个 PR 创建独立预览。

## 环境变量

环境文件统一放在 `env/`，沿用 [Vite 的加载规则](https://vite.dev/guide/env-and-mode)：公共 `.env`、本地 `.env.local`、模式 `.env.[mode]`、模式本地 `.env.[mode].local` 依次覆盖，进程环境优先级最高。本地文件已被 Git 忽略，修改后重启开发进程。

- `VITE_APP_TITLE`：应用名称，默认「如期手记」。
- `VITE_WX_APPID`：微信小程序 AppID，在 `.env.local` 覆盖。
- `VITE_UNI_APPID`：DCloud AppID，在 `.env.local` 覆盖。
- `VITE_SERVER_BASEURL`：接口地址；开发默认为 `http://127.0.0.1:8080`，测试/生产默认使用不可用的示例地址，防止误连模板服务。
- 微信真机与 App 调试时，把开发接口地址写入 `.env.development.local`，使用电脑局域网 IP；`127.0.0.1` 指向设备本身。
- 正式接口地址写入 `.env.production.local` 或由 CI 环境注入。微信正式版还需配置请求合法域名。
- `VITE_APP_PROXY_ENABLE` / `VITE_APP_PROXY_PREFIX`：仅 H5 开发代理，默认关闭，前缀为 `/api`。
- `VITE_SERVER_BASEURL__WEIXIN_DEVELOP/TRIAL/RELEASE`：按微信运行版本覆盖后台地址，不配置则回退到当前 mode 的地址。
- `OPENAPI_SCHEMA_URL`：可选的 OpenAPI 文档地址，填写后运行 `pnpm openapi`，生成到 `src/service/`。

`VITE_` 变量会进入客户端包，只能存放公开配置；AppSecret、签名密码等不得写在其中。上传私钥 `private.<appid>.key` 已被 Git 忽略。上传脚本与构建使用相同的 Vite 环境加载方式。

## 代码与目录

```text
src/config/app.ts    应用名称、简介、头像和版本的统一入口
src/pages/           首页、我的、关于与账号占位页
src/api/             接口定义；认证接口沿用模板契约，需对接真实服务
src/http/            请求封装与拦截器
src/store/           用户、token 与持久化状态
src/router/          路由和登录策略
src/tabbar/          底部导航配置与角色守卫
src/static/images/   品牌头像与通用图片
src/static/app/      App 图标
src/service/         OpenAPI 生成代码，不手改
hermes/              工程规范
```

首页默认允许游客访问。登录与注册页面暂为占位页；接入后端后，再按实际登录方式调整 `src/api/login.ts`、`src/router/config.ts` 和账号页面。图表组件及 API 示例保留作开发参考，图表演示分包未注册到应用中。

页面配置在页面内 `definePage` 宏中维护，全局页面样式改 `pages.config.ts`；应用清单改 `manifest.config.ts`。平台差异用 uni-app 条件编译。主题主色为暖棕色，统一关联 UnoCSS、Wot UI、uni.scss 和 tabbar。

## 质量检查

```bash
pnpm type-check
pnpm lint
pnpm test:run
# 或一次运行以上检查
pnpm check
```

Wot UI 的组件类型通过组件解析插件按使用情况生成，避免全量引入第三方 SFC 参与项目检查。

测试覆盖请求 hook、用户状态、防抖、tabbar 和路由权限。ESLint 排除第三方图表源码、技能示例和生成物。Husky 在提交前运行 lint-staged，在提交信息阶段执行 Conventional Commits 校验。GitHub Actions 执行冻结依赖安装、三端资源构建及质量检查。

项目保留 unibest 的 MIT 许可证与第三方组件版权信息。框架升级使用 `pnpm uvm`，升级后重新验证三端，不自动追随最新版本。
