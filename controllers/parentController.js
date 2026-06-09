const Parent = require('../models/Parent')
const Medicine = require('../models/Medicine')
const Log = require('../models/Log')
const Alert = require('../models/Alert')

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

    // auto-format phone number
    phone = phone.trim()
    if (!phone.startsWith('+')) {
      // if user enters 9589654044 → auto convert to +919589654044
      phone = '+91' + phone
    }

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
    const parentId = req.params.id;

    await Parent.findOneAndDelete({
      _id: parentId,
      userId: req.user.id
    });

    await Medicine.deleteMany({ parentId });

    await Log.deleteMany({ parentId });

    await Alert.deleteMany({ parentId });

    res.redirect('/parents');
  } catch (err) {
    console.error(err);
    res.redirect('/parents');
  }
}


exports.getEditParent = async (req, res) => {
  try {
    const parent = await Parent.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    if (!parent) return res.redirect('/parents')
    res.render('editParent', { parent, error: null })
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}

exports.editParent = async (req, res) => {
  try {
    let { name, phone, relationship } = req.body

    // auto format phone
    phone = phone.trim()
    if (!phone.startsWith('+')) {
      phone = '+91' + phone
    }

    await Parent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, phone, relationship }
    )

    res.redirect('/parents')
  } catch (err) {
    console.error(err)
    res.redirect('/parents')
  }
}