const Log = require('../models/Log')
const Alert = require('../models/Alert')
const { sendWhatsApp } = require('../services/twilio')

exports.handleReply = async (req, res) => {
  try {
    // 1. Twilio sends reply data in req.body
    const incomingMsg = req.body.Body?.trim()  // "1" or "2"
    const fromNumber = req.body.From?.replace('whatsapp:', '')
    // removes "whatsapp:" prefix → gives clean number

    console.log(`📩 Reply received from ${fromNumber}: "${incomingMsg}"`)

    // 2. Find the most recent PENDING log for this number
    const log = await Log.findOne({
      status: 'pending'
    })
    .populate('medicineId')   // need medicine name
    .populate('parentId')     // need parent name
    .sort({ createdAt: -1 }) // most recent first

    if (!log) {
      // no pending log found — maybe already resolved
      await sendWhatsApp(fromNumber, 
        '✅ Koi pending dawai nahi mili. Shukriya!')
      return res.status(200).send('<Response></Response>')
    }

    // 3. Handle reply
    if (incomingMsg === '1') {
      // ─── TAKEN ────────────────────────────────────────
      log.status = 'taken'
      log.respondedAt = new Date()
      await log.save()

      console.log(`✅ ${log.medicineId.name} marked as TAKEN`)

      // delete any alert created for this dose
      await Alert.deleteOne({
        medicineId: log.medicineId._id,
        userId: log.userId
      })

      // send confirmation to elder
      await sendWhatsApp(fromNumber,
        `✅ Bahut achha! ${log.medicineId.name} le li note ho gayi.\n\nApna khayal rakhein! 🙏`
      )

    } else if (incomingMsg === '2') {
      // ─── NOT TAKEN ────────────────────────────────────
      log.status = 'missed'
      log.respondedAt = new Date()
      await log.save()

      console.log(`❌ ${log.medicineId.name} marked as MISSED`)

      // create alert for child if not already created
      const existingAlert = await Alert.findOne({
        medicineId: log.medicineId._id,
        userId: log.userId
      })

      if (!existingAlert) {
        await Alert.create({
          userId: log.userId,
          parentId: log.parentId,
          medicineId: log.medicineId._id,
          message: `Papa ne ${log.medicineId.name} ${log.medicineId.dosage} lene se mana kar diya at ${log.scheduledTime}`
        })
      }

      // encourage elder
      await sendWhatsApp(fromNumber,
        `⚠️ Koi baat nahi! Kripya jaldi le lein.\n\n${log.medicineId.name} ${log.medicineId.dosage}\n\nDawai lena bahut zaroori hai. 🙏`
      )

    } else {
      // ─── UNKNOWN REPLY ─────────────────────────────
      await sendWhatsApp(fromNumber,
        `Kripya sirf *1* ya *2* reply karein.\n\n1️⃣ → ✅ Haan le li\n2️⃣ → ❌ Abhi nahi li`
      )
    }

    // 4. Twilio expects this response — always send it
    res.status(200).send('<Response></Response>')

  } catch (err) {
    console.error('❌ Webhook error:', err.message)
    res.status(200).send('<Response></Response>')
    // always send 200 to Twilio — even on error
    // otherwise Twilio keeps retrying ❌
  }
}