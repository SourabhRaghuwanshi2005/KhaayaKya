const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  try {
    // 1. Get token from cookie
    const token = req.cookies.token

    // 2. If no token — redirect to login
    if (!token) {
      return res.redirect('/login')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 3. Attach user info to req object
    req.user = decoded

    next()

  } catch (err) {
    res.clearCookie('token')
    res.redirect('/login')
  }
}