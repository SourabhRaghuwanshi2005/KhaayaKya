console.log('=== TWILIO DEBUG ===')
console.log('SID:', process.env.TWILIO_ACCOUNT_SID)
console.log('TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'EXISTS' : 'MISSING')
console.log('FROM:', process.env.TWILIO_WHATSAPP_FROM)
console.log('===================')

const twilio = require('twilio')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)///its like ...login(username, password).... app-> client -> twilio server

const sendWhatsApp = async (to, message) => {
  try {
    const response = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
        to: `whatsapp:${to}`,
        body: message
    })
    console.log(`✅ WhatsApp sent to ${to}:`, response.sid)
    return response
  } catch (err) {
    console.error(`❌ WhatsApp failed to ${to}:`, err.message)
    throw err
  }
}

module.exports = { sendWhatsApp }