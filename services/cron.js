const cron = require('node-cron')
const Medicine = require('../models/Medicine')
const Log = require('../models/Log')
const Alert = require('../models/Alert')
const { sendWhatsApp } = require('./twilio')

// ─── HELPER: GET TODAY'S DATE STRING ──────────────────────
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
  // returns "2026-05-21"
}

// ─── HELPER: GET CURRENT TIME STRING ──────────────────────
const getCurrentTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
  // returns "09:00"
}

// ─── MAIN CRON JOB ────────────────────────────────────────
// runs every minute
cron.schedule('* * * * *', async () => {
  try {
    const currentTime = getCurrentTime()
    const today = getTodayDate()

    console.log(`⏰ Cron running at ${currentTime}`)

    // 1. find all active medicines scheduled for this exact time
    const dueMedicines = await Medicine.find({
      isActive: true,
      times: currentTime  // checks if currentTime exists in times array
    }).populate('parentId')
    // populate → replaces parentId with actual parent object
    // so we can access medicine.parentId.name, medicine.parentId.phone

    if (dueMedicines.length === 0) return
    // nothing due right now — exit early

    for (const medicine of dueMedicines) {
      // 2. check if log already exists for this medicine today at this time
      // prevents duplicate logs if cron fires twice in same minute
      const existingLog = await Log.findOne({
        medicineId: medicine._id,
        date: today,
        scheduledTime: currentTime
      })

      if (existingLog) continue
      // log already created — skip this medicine

      // 3. create a new log with status "pending"
      const log = await Log.create({
        medicineId: medicine._id,
        parentId: medicine.parentId._id,
        userId: medicine.userId,
        scheduledTime: currentTime,
        status: 'pending',
        date: today
      })

      console.log(`📋 Log created for ${medicine.name} — ${medicine.parentId.name}`)

      // 4. send WhatsApp reminder
      // (Twilio will plug in here on Day 4 when dashboard is back)
      // for now just log to console
      await sendWhatsApp(
        medicine.parentId.phone,
        `💊 Dawai ka waqt ho gaya!\n\n*${medicine.name} ${medicine.dosage}*\n${medicine.withFood ? 'Khaane ke baad lena hai' : 'Khaane se pehle lena hai'}\n\nKya aapne le li?\n\n1️⃣ Reply *1* → ✅ Haan le li\n2️⃣ Reply *2* → ❌ Abhi nahi li`
      )

      // 5. schedule follow up after 15 minutes
      // if no response → mark as missed → create alert
      setTimeout(async () => {
        await checkAndMarkMissed(log._id, medicine)
      }, 15 * 60 * 1000) // 15 minutes in milliseconds

    }

  } catch (err) {
    console.error('❌ Cron error:', err.message)
  }
})

// ─── CHECK IF MISSED AFTER 15 MINS ────────────────────────
const checkAndMarkMissed = async (logId, medicine) => {
  try {

    // re-fetch medicine to get LATEST isActive status
    // because elder might have deactivated it after reminder was sent
    const freshMedicine = await Medicine.findById(medicine._id)

    // medicine was deactivated after reminder fired → skip everything
    if (!freshMedicine || !freshMedicine.isActive) {
      console.log(`⏭️ Skipping ${medicine.name} — medicine is now inactive`)
      // clean up the pending log silently
      await Log.findByIdAndUpdate(logId, { status: 'missed' })
      return
    }

    const log = await Log.findById(logId)

    if (log && log.status === 'pending') {
      log.status = 'missed'
      await log.save()

      console.log(`❌ ${medicine.name} marked as MISSED for ${medicine.parentId.name}`)

      await Alert.create({
        userId: medicine.userId,
        parentId: medicine.parentId._id,
        medicineId: medicine._id,
        message: `${medicine.parentId.name} missed ${medicine.name} ${medicine.dosage} at ${log.scheduledTime}`
      })

      console.log(`🔔 Alert created for child`)

      await sendWhatsApp(
        medicine.parentId.phone,
        `⏰ Papa, aapne abhi tak dawai lene ki confirmation nahi di!\n\n*${medicine.name} ${medicine.dosage}*\n\nKya aapne le li?\n\n1️⃣ Reply *1* → ✅ Haan le li\n2️⃣ Reply *2* → ❌ Abhi nahi li`
      )
    }

  } catch (err) {
    console.error('❌ checkAndMarkMissed error:', err.message)
  }
}

console.log('✅ Cron job initialized')