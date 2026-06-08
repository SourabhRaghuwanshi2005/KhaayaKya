const { GoogleGenAI } = require("@google/genai")
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const analyzeAdherence = async (logs, parentName, medicines) => {
  try {

    // 1. prepare data in readable format for Gemini
    const logSummary = logs.map(log => ({
      medicine: log.medicineId?.name || 'Unknown',
      dosage: log.medicineId?.dosage || '',
      scheduledTime: log.scheduledTime,
      status: log.status,
      date: log.date,
      day: new Date(log.date).toLocaleDateString('en-IN', { weekday: 'long' })
    }))

    // 2. build the prompt
    const prompt = `
You are a caring health assistant helping a family track medicine adherence for their elderly parent.

Patient Name: ${parentName}

Here is the medicine adherence data for the last 14 days:
${JSON.stringify(logSummary, null, 2)}

Medicines prescribed:
${medicines.map(m => `- ${m.name} ${m.dosage} at ${m.times.join(', ')}`).join('\n')}

Please analyze this data and provide:
1. Which medicines are being missed the most?
2. Is there a TIME pattern? (morning doses missed more than evening or vice versa)
3. Is there a DAY pattern? (specific days when doses are missed more)
4. What might be causing these missed doses?
5. What should the family do differently?

Reply in warm, simple Hindi-English (Hinglish) as if talking to a worried son or daughter.
Keep it concise — maximum 150 words.
Use emojis to make it friendly.
Do not use complex medical terms.
`

    // 3. call Gemini API
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [prompt],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7
      }
    })

    return result.text.trim()

  } catch (err) {
    console.error('❌ Gemini error:', err.message)
    throw err
  }
}

const correlateSymptoms = async (symptoms, logs, parentName) => {
  try {

    const prompt = `
You are a health assistant helping a family understand their elderly parent's health.

Patient Name: ${parentName}

Reported symptoms in last 14 days:
${symptoms.map(s => `- ${s.description} on ${s.date}`).join('\n')}

Medicine adherence in last 14 days:
${logs.map(l => `- ${l.medicineId?.name} on ${l.date}: ${l.status}`).join('\n')}

Please check:
1. Were any symptoms reported after missed doses?
2. Is there a correlation between missed medicines and symptoms?
3. What should the family mention to the doctor?

Reply in warm Hinglish. Maximum 100 words. Use emojis.
`

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [prompt],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    })

    return result.text.trim()

  } catch (err) {
    console.error('❌ Gemini symptom correlation error:', err.message)
    throw err
  }
}

module.exports = { analyzeAdherence, correlateSymptoms }