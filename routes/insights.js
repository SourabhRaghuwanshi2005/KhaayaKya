const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const insightsController = require('../controllers/insightsController')

router.get('/:parentId', auth, insightsController.getInsights)

module.exports = router