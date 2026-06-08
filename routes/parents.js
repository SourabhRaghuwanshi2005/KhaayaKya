const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const parentController = require('../controllers/parentController')

router.get('/', auth, parentController.getParents)
router.post('/add', auth, parentController.addParent)
router.post('/delete/:id', auth, parentController.deleteParent)

module.exports = router