const Parent = require('../models/Parent')

exports.getParents = async (req, res) => {
  try {
    const parents = await Parent.find({ userId: req.user.id })
    res.render('parents', { parents, error: null, success: null })
  } catch (err) {
    console.error(err)
    res.render('parents', { parents: [], error: 'Failed to load.', success: null })
  }
}

exports.addParent = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body
    await Parent.create({
      name,
      phone,
      relationship,
      userId: req.user.id
    })
    const parents = await Parent.find({ userId: req.user.id })
    res.render('parents', { parents, error: null, success: 'Parent added successfully!' })
  } catch (err) {
    console.error(err)
    const parents = await Parent.find({ userId: req.user.id })
    res.render('parents', { parents, error: 'Failed to add parent.', success: null })
  }
}

exports.deleteParent = async (req, res) => {
  try {
    await Parent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })
    res.redirect('/parents')
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}