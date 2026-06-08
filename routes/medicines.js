const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const medicineController = require('../controllers/medicineController')

router.get('/:parentId', auth, medicineController.getMedicines)
router.post('/add', auth, medicineController.addMedicine)
router.post('/toggle/:id', auth, medicineController.toggleMedicine)
router.post('/delete/:id', auth, medicineController.deleteMedicine)

module.exports = router