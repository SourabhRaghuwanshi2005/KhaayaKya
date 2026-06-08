const Medicine = require('../models/Medicine')
const Parent = require('../models/Parent')
const Log = require('../models/Log')
const Alert = require('../models/Alert') 

exports.getMedicines = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      _id: req.params.parentId,
      userId: req.user.id
    })
    if (!parent) return res.redirect('/parents')

    const medicines = await Medicine.find({ parentId: req.params.parentId })
    res.render('medicines', { medicines, parent, error: null, success: null })
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}

exports.addMedicine = async (req, res) => {
  try {
    const { name, dosage, times, withFood, parentId } = req.body
    const timesArray = times.split(',').map(t => t.trim())

    await Medicine.create({
      name,
      dosage,
      times: timesArray,
      withFood: withFood === 'true',
      parentId,
      userId: req.user.id
    })
    res.redirect(`/medicines/${parentId}`)
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}

exports.toggleMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    if (!medicine) return res.redirect('/parents')

    medicine.isActive = !medicine.isActive
    await medicine.save()
    res.redirect(`/medicines/${medicine.parentId}`)
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    const parentId = medicine.parentId

    await Medicine.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    await Log.deleteMany({ medicineId: req.params.id })
    await Alert.deleteMany({ medicineId: req.params.id })
    
    res.redirect(`/medicines/${parentId}`)
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}