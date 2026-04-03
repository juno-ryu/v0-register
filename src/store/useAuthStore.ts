import Cookies from 'js-cookie'
import { create } from 'zustand'

const ACCESS_TOKEN_KEY = 'arabiz-access-token'
const REFRESH_TOKEN_KEY = 'arabiz-refresh-token'
const COOKIE_OPTIONS = { secure: true, sameSite: 'strict' as const }

// 정산 전용 계정 (레거시: isSettlementAccount = userName === 'godjay')
export const SETTLEMENT_USERNAME = 'godjay'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isSuperUser: boolean
  userName: string | null
  managementId: string | null
  userBrandId: string | null
  userStoreId: string | null
  // 레거시 brandDetail.use_membership_user: 고객관리/지급관리 메뉴 노출 조건
  useMembershipUser: boolean
  // 레거시 brandDetail.domain: 쿠폰 URL 생성용
  brandDomain: string | null
}

interface AuthActions {
  setAuth: (payload: {
    accessToken: string
    refreshToken: string
    isSuperUser: boolean
    userName: string
    managementId: string | null
    userBrandId: string | null
    userStoreId: string | null
  }) => void
  setUseMembershipUser: (value: boolean) => void
  setBrandDomain: (value: string | null) => void
  setTokens: (access: string, refresh: string) => void
  signOut: () => void
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isSuperUser: false,
  userName: null,
  managementId: null,
  userBrandId: null,
  userStoreId: null,
  useMembershipUser: false,
  brandDomain: null,
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuth: (payload) => {
    Cookies.set(ACCESS_TOKEN_KEY, payload.accessToken, COOKIE_OPTIONS)
    Cookies.set(REFRESH_TOKEN_KEY, payload.refreshToken, COOKIE_OPTIONS)
    set({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      isSuperUser: payload.isSuperUser,
      userName: payload.userName,
      managementId: payload.managementId,
      userBrandId: payload.userBrandId,
      userStoreId: payload.userStoreId,
    })
  },

  setUseMembershipUser: (value) => {
    set({ useMembershipUser: value })
  },

  setBrandDomain: (value) => {
    set({ brandDomain: value })
  },

  setTokens: (access, refresh) => {
    Cookies.set(ACCESS_TOKEN_KEY, access, COOKIE_OPTIONS)
    Cookies.set(REFRESH_TOKEN_KEY, refresh, COOKIE_OPTIONS)
    set({ accessToken: access, refreshToken: refresh })
  },

  signOut: () => {
    Cookies.remove(ACCESS_TOKEN_KEY)
    Cookies.remove(REFRESH_TOKEN_KEY)
    set(initialState)
  },
}))

// 파생 상태 셀렉터
// 레거시 store/auth/index.js getters와 동일하게 유지
export const selectIsAuthenticated = (state: AuthState) =>
  state.accessToken !== null

// 레거시: isManagementAccount = !!state.managementId (빈 문자열도 false)
export const selectIsManagementAccount = (state: AuthState) =>
  !!state.managementId

// 레거시: isBrandAccount = !!state.brandId (빈 문자열도 false)
export const selectIsBrandAccount = (state: AuthState) =>
  !!state.userBrandId

// 레거시: isStoreAccount = !!state.storeId (빈 문자열도 false)
export const selectIsStoreAccount = (state: AuthState) =>
  !!state.userStoreId

// 레거시: isSettlementAccount = state.userName === 'godjay'
export const selectIsSettlementAccount = (state: AuthState) =>
  state.userName === SETTLEMENT_USERNAME

export const selectUserName = (state: AuthState) => state.userName

export const selectUserStoreId = (state: AuthState) => state.userStoreId

// 레거시 brandDetail.use_membership_user: 고객관리/지급관리 메뉴 노출 조건
export const selectUseMembershipUser = (state: AuthState) => state.useMembershipUser

// 레거시 brandDetail.domain: 쿠폰 URL 생성용
export const selectBrandDomain = (state: AuthState) => state.brandDomain
