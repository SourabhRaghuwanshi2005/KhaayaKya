const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const symptomController = require('../controllers/symptomController')

router.post('/add', auth, symptomController.addSymptom)

module.exports = router