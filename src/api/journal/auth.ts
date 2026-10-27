export interface LocalSession {
  phone: string
  mode: 'local-demo'
}
export interface PhoneAuthGateway {
  sendCode: (phone: string) => Promise<void>
  login: (phone: string, code: string) => Promise<LocalSession>
}
export function validPhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone)
}
/** 仅用于单机验收，不产生真实短信或服务端 token。API 接入时替换此适配器。 */
export const phoneAuthGateway: PhoneAuthGateway = {
  async sendCode(phone) {
    if (!validPhone(phone))
      throw new Error('请输入正确的 11 位手机号码')
  },
  async login(phone, code) {
    if (!validPhone(phone))
      throw new Error('请输入正确的 11 位手机号码')
    if (code !== '9999')
      throw new Error('验证码不正确，请输入 9999')
    return { phone, mode: 'local-demo' }
  },
}
