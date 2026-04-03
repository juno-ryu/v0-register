// jwtParseHelper.js 포팅 - JWT 페이로드 디코딩

interface JwtPayload {
  is_superuser: boolean
  username: string
  management: string | null
  brand: string | null
  store: string | null
  [key: string]: unknown
}

export const parseJwt = (token: string): JwtPayload => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return {
      is_superuser: false,
      username: '',
      management: null,
      brand: null,
      store: null,
    }
  }
}
