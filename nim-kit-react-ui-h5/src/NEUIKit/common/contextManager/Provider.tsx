import RootStore from '@xkit-yx/im-store-v2'
import { LocalOptions } from '@xkit-yx/im-store-v2/dist/types/types'
import { observer } from 'mobx-react'
import { NIM } from 'nim-web-sdk-ng/dist/esm/nim'
import sdkPkg from 'nim-web-sdk-ng/package.json'
import React, { createContext, FC, memo, ReactNode, useCallback, useEffect, useMemo } from 'react'

import zh from '../locales/zh'

export interface ContextProps {
  nim?: NIM
  store?: RootStore
  localOptions?: Partial<LocalOptions>
  t?: (str: keyof typeof zh) => string
  locale?: 'zh' | 'en' | string
}

export interface ProviderProps {
  children: ReactNode
  localOptions?: Partial<LocalOptions>
  nim: NIM
  singleton?: boolean
  locale?: 'zh' | 'en'
  localeConfig?: { [key in keyof typeof zh]?: string }
  renderImDisConnected?: () => JSX.Element
  renderImConnecting?: () => JSX.Element
}

export const Context = createContext<ContextProps>({})

export const Provider: FC<ProviderProps> = memo(function Main({
  children,
  localOptions,
  nim,
  locale = 'zh',
  localeConfig = zh,
  singleton = false
}) {
  const localeMap = useMemo(
    () => ({
      zh
    }),
    []
  )

  const t = useCallback(
    (str: keyof typeof zh) => {
      return {
        ...(localeMap[locale] || zh),
        ...localeConfig
      }[str]
    },
    [locale, localeConfig, localeMap]
  )

  const finalLocalOptions = useMemo(() => {
    return { ...localOptions }
  }, [localOptions])

  const rootStore = useMemo(() => {
    if (singleton) {
      // @ts-ignore
      return RootStore.getInstance(nim, finalLocalOptions, 'H5')
    }

    // @ts-ignore
    return new RootStore(nim, finalLocalOptions, 'H5')
  }, [nim, singleton, finalLocalOptions])

  // @ts-ignore
  window.__xkit_store__ = {
    nim,
    store: rootStore,
    localOptions: finalLocalOptions,
    sdkVersion: sdkPkg.version
  }

  useEffect(() => {
    return () => {
      if (!singleton) {
        rootStore.destroy()
      }
    }
  }, [rootStore, singleton])

  return (
    <Context.Provider
      value={{
        store: rootStore,
        nim,
        localOptions: finalLocalOptions,
        locale,
        t
      }}
    >
      <App>{children}</App>
    </Context.Provider>
  )
})

type Props = {
  children: ReactNode
}

export const App: FC<Props> = observer(({ children }) => {
  // const { store } = useStateContext()

  // const render = () => {
  //   switch (store.connectStore.loginStatus) {
  //     case V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_UNLOGIN:
  //     case V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED:
  //       return children
  //     case V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINING:
  //       return <span>Loading……</span>
  //     case V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGOUT:
  //       return <span>当前网络不可用，请检查网络设置，刷新页面</span>
  //     default:
  //       return null
  //   }
  // }

  // return <>{render()}</>

  return <>{children}</>
})
