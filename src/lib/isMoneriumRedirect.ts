const isMoneriumRedirect = () => {
    if (typeof window === 'undefined') {
      return false
    }
    const authCode = new URLSearchParams(window.location.search).get('code')
  
    return !!authCode
  }
  
  export default isMoneriumRedirect