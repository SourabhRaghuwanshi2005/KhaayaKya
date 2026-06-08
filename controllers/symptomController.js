const Symptom = require('../models/Symptom')
const Parent = require('../models/Parent')

exports.addSymptom = async (req, res) => {
  try {
    const { description, parentId, date } = req.body

    await Symptom.create({
      userId: req.user.id,
      parentId,
      description,
      date: date || new Date().toISOString().split('T')[0]
    })

    // invalidate correlation cache → force fresh generation
    await Parent.findByIdAndUpdate(parentId, {
      correlationGeneratedAt: null  // ← cache busted ✅
    })

    res.redirect(`/insights/${parentId}`)
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}