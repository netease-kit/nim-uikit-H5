import { NIM_APP_KEY } from '@/config'

// API 基础路径
const baseUrl = 'https://yiyong-user-center.netease.im'

// 接口请求头
const loginByCodeHeader: { [key: string]: string | number } = {
  appKey: NIM_APP_KEY,
  parentScope: 2,
  scope: 7
}

// API 路径映射
const urlMap = {
  getLoginSmsCode: '/userCenter/v1/auth/sendLoginSmsCode',
  loginRegisterByCode: '/userCenter/v1/auth/loginRegisterByCode',
  loginRegisterByToken: '/userCenter/v1/auth/loginByToken',
  logout: '/userCenter/v1/auth/logout'
}

// 验证码响应类型
export interface LoginSmsCodeRes {
  isFirstRegister: boolean
}

// 登录响应类型
export interface LoginRegisterByCodeRes {
  accessToken: string
  imAccid: string
  imToken: string
}

/**
 * 获取登录验证码
 * @param data 请求参数
 * @returns Promise<LoginSmsCodeRes>
 */
export const getLoginSmsCode = (data: { mobile: string }): Promise<LoginSmsCodeRes> => {
  const url = baseUrl + urlMap.getLoginSmsCode

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...loginByCodeHeader
    },
    body: JSON.stringify(data)
  }).then(async (response) => {
    const responseData = await response.json()
    if (responseData.code !== 200) {
      throw responseData
    }
    return responseData.data as LoginSmsCodeRes
  })
}

/**
 * 通过验证码登录或注册
 * @param data 请求参数
 * @returns Promise<LoginRegisterByCodeRes>
 */
export const loginRegisterByCode = (data: { mobile: string; smsCode: string }): Promise<LoginRegisterByCodeRes> => {
  const url = baseUrl + urlMap.loginRegisterByCode

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...loginByCodeHeader
    },
    body: JSON.stringify(data)
  }).then(async (response) => {
    const responseData = await response.json()
    if (responseData.code !== 200) {
      throw responseData
    }
    return responseData.data as LoginRegisterByCodeRes
  })
}
