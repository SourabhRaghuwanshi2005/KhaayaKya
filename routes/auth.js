const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")

router.get("/register",(req,res) => {
    res.render('auth/register', {error : null});
})

router.post("/register",authController.registerUser);

router.get("/login", (req,res)=>{
    res.render("auth/login", {error : null})
})

router.post('/login', authController.loginUser)


router.get('/logout', (req, res) => {
  res.clearCookie('token')   
  res.redirect('/login')
})

module.exports = router