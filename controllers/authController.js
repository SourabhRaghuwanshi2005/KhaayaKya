const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.registerUser = async (req,res) => {
    try{

        const {name, email, password} = req.body
            // 1. Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.render('auth/register', { 
                error: 'Email already registered. Please login.' 
            })
        }

            // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

            // 3. Save new user to MongoDB
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

            // 4. Create JWT token
        const token = jwt.sign(
            { id: user._id, name: user.name },  
            process.env.JWT_SECRET,              
            { expiresIn: '7d' }                  
        )

            // 5. Store token in cookie
        res.cookie('token', token, {
            httpOnly: true,    // JS in browser cannot access this cookie — security
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
        })

            // 6. Redirect to dashboard
        res.redirect('/dashboard')

    }catch(err){
        console.error(err)
        res.render('auth/register', { error: 'Something went wrong. Try again.' })
    }    
}

exports.loginUser = async (req, res) =>{
  try {
    const { email, password } = req.body

    // 1. Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.render('auth/login', { 
        error: 'No account found with this email.' 
      })
    }

    // 2. Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.render('auth/login', { 
        error: 'Wrong password. Try again.' 
      })
    }

    // 3. Create JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 4. Store in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // 5. Redirect to dashboard
    res.redirect('/dashboard')

  } catch (err) {
    console.error(err)
    res.render('auth/login', { error: 'Something went wrong. Try again.' })
  }    
}