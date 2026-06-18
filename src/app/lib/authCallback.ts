export const getMergedUrlParams = () => {
  const params = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)

  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })

  return params
}

export const getAppTokenFromParams = (params: URLSearchParams) => {
  return (
    params.get('accessToken') ||
    params.get('access_token') ||
    params.get('token') ||
    params.get('jwt') ||
    params.get('jwtToken') ||
    params.get('appToken') ||
    params.get('authToken') ||
    params.get('auth_token')
  )
}

export const getGithubAccessTokenFromParams = (params: URLSearchParams) => {
  return (
    params.get('githubAccessToken') ||
    params.get('github_access_token') ||
    params.get('github_token') ||
    params.get('githubToken')
  )
}

export const getOAuthErrorFromParams = (params: URLSearchParams) => {
  return params.get('message') || params.get('error_description') || params.get('error')
}
