const Parent = require('../models/Parent')
const Medicine = require('../models/Medicine')
const Log = require('../models/Log')
const Alert = require('../models/Alert')

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id
    const today = new Date().toISOString().split('T')[0]

    // 1. get all parents of this child
    const parents = await Parent.find({ userId })

    // 2. get today's logs for all parents
    const todayLogs = (await Log.find({ userId, date: today })
      .populate('medicineId')
      .populate('parentId'))
      .filter(log => log.parentId && log.medicineId)

    // 3. get unread alerts
    const alerts = (await Alert.find({ userId, isRead: false })
      .populate('medicineId')
      .populate('parentId')
      .sort({ createdAt: -1 })
      .limit(10))
      .filter(alert => alert.parentId && alert.medicineId)

    // 4. get all medicines
    const medicines = await Medicine.find({ userId, isActive: true })

    // 5. calculate weekly adherence per medicine
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    
    const weeklyLogs = await Log.find({
      userId,
      date: { $gte: sevenDaysAgoStr }
      // $gte = greater than or equal to
      // finds all logs from last 7 days
    })

    // calculate adherence % per medicine
    const adherence = {}
    medicines.forEach(med => {
      const medLogs = weeklyLogs.filter(
        log => log.medicineId.toString() === med._id.toString()
      )
      const takenCount = medLogs.filter(log => log.status === 'taken').length
      const totalCount = medLogs.length
      adherence[med._id] = totalCount > 0
        ? Math.round((takenCount / totalCount) * 100)
        : 0
      // example: 5 taken out of 7 total → 71%
    })

    // 6. build today's schedule
    // group today's logs by parent
    const schedule = {}
    parents.forEach(parent => {
      schedule[parent._id] = {
        parent,
        logs: todayLogs.filter(
          log =>
            log.parentId &&
            log.parentId._id.toString() === parent._id.toString()
        )
      }
    })

    res.render('dashboard', {
      user: req.user,
      parents,
      medicines,
      alerts,
      adherence,
      schedule,
      today
    })

  } catch (err) {
    console.error(err)
    res.render('dashboard', {
      user: req.user,
      parents: [],
      medicines: [],
      alerts: [],
      adherence: {},
      schedule: {},
      today: ''
    })
  }
}

exports.clearAlerts = async (req, res) => {
  try {
    await Alert.deleteMany({ userId: req.user.id })
    res.redirect('/dashboard')
  } catch (err) {
    console.error(err)
    res.redirect('/dashboard')
  }
}