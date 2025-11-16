export const fetch_timeout: typeof fetch = async function (resource, options = {}) {
    const  timeout = 8000 
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
  
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    })
    clearTimeout(id)
    if (! response.ok){
        throw 'timeout'
    }
    return response
  }