import { describe, expect, it } from 'vitest'
import { phoneAuthGateway } from './auth'

describe('单机手机号验证码登录', () => {
  it('只接受有效手机号和固定验证码 9999', async () => {
    await expect(phoneAuthGateway.login('13800138000', '9999')).resolves.toEqual({ phone: '13800138000', mode: 'local-demo' })
    await expect(phoneAuthGateway.login('13800138000', '0000')).rejects.toThrow('验证码不正确')
    await expect(phoneAuthGateway.login('123', '9999')).rejects.toThrow('手机号码')
  })
  it('获取验证码也验证手机号', async () => {
    await expect(phoneAuthGateway.sendCode('13800138000')).resolves.toBeUndefined()
    await expect(phoneAuthGateway.sendCode('')).rejects.toThrow('手机号码')
  })
})
