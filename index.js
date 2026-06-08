//

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const authRoutes = require('./routes/auth') 
const parentRoute = require("./routes/parents")
const medicineRoute = require("./routes/medicines")
const webhookRoute = require('./routes/webhook') 
const dashboardRoute = require('./routes/dashboard') 
const insightsRoute = require('./routes/insights')   
const symptomsRoute = require('./routes/symptoms') 

const cookieParser = require('cookie-parser') 

//

const app = express();

//
app.set("view engine","ejs")
app.set("views", path.join(__dirname, "views"))

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cookieParser())

//
app.use('/', authRoutes)
app.use("/parents", parentRoute)
app.use("/medicines", medicineRoute)
app.use('/webhook', webhookRoute)
app.use('/insights', insightsRoute)    
app.use('/symptoms', symptomsRoute)

app.get('/', (req, res) => {
  res.render('index') ;
});
app.use('/dashboard', dashboardRoute) 

//MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    require('./services/cron')

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });