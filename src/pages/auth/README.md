# 账号页面

登录与注册当前为占位页，不发送模板账号请求，也不展示虚假的注册成功结果。

请求、token 与用户状态封装继续保留。后续根据后端协议对接 `src/api/login.ts`、`src/api/types/login.ts`、`src/store/token.ts`，再实现页面交互。

默认游客可以访问首页。小程序是否使用独立登录页由 `src/router/config.ts` 的 `LOGIN_PAGE_ENABLE_IN_MP` 控制；微信 `uni.login` 只能获取临时凭证，仍需服务端完成登录。
