const Parent = require('../models/Parent')
const Log = require('../models/Log')
const Medicine = require('../models/Medicine')
const Symptom = require('../models/Symptom')
const { analyzeAdherence, correlateSymptoms } = require('../services/gemini')
const { marked } = require('marked')

exports.getInsights = async (req, res) => {
  try {
    const { parentId } = req.params
    const userId = req.user.id

    // ─── 1. VERIFY PARENT BELONGS TO THIS USER ────────
    const parent = await Parent.findOne({ _id: parentId, userId })
    if (!parent) return res.redirect('/parents')

    // ─── 2. BUILD 14 DAYS AGO DATE STRING ─────────────
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0]

    // ─── 3. FETCH ALL REQUIRED DATA ───────────────────
    const logs = await Log.find({
      parentId,
      date: { $gte: fourteenDaysAgoStr }
    }).populate('medicineId')

    const medicines = await Medicine.find({ parentId, userId })

    const symptoms = await Symptom.find({
      parentId,
      date: { $gte: fourteenDaysAgoStr }
    })

    // ─── 4. AI INSIGHT — WITH 6 HOUR CACHE ───────────
    let insight = null
    let correlation = null

    if (logs.length > 0) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

      if (
        parent.cachedInsight &&
        parent.insightGeneratedAt &&
        parent.insightGeneratedAt > sixHoursAgo
      ) {
        // cache is fresh → use it
        insight = parent.cachedInsight
        console.log('✅ Using cached insight — no Gemini call')
      } else {
        // cache expired or missing → generate fresh
        insight = await analyzeAdherence(logs, parent.name, medicines)
        parent.cachedInsight = insight
        parent.insightGeneratedAt = new Date()
        await parent.save()
        console.log('🧠 Fresh insight generated and cached')
      }
    }

    // ─── 5. SYMPTOM CORRELATION — WITH 1 HOUR CACHE ──
    if (symptoms.length > 0 && logs.length > 0) {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)

      if (
        parent.cachedCorrelation &&
        parent.correlationGeneratedAt &&
        parent.correlationGeneratedAt > oneHourAgo
      ) {
        // cache is fresh → use it
        correlation = parent.cachedCorrelation
        console.log('✅ Using cached correlation — no Gemini call')
      } else {
        // cache expired or missing → generate fresh
        correlation = await correlateSymptoms(symptoms, logs, parent.name)
        parent.cachedCorrelation = correlation
        parent.correlationGeneratedAt = new Date()
        await parent.save()
        console.log('🧠 Fresh correlation generated and cached')
      }
    }

    // ─── 6. CONVERT MARKDOWN TO HTML ──────────────────
    if (insight) insight = marked(insight)
    if (correlation) correlation = marked(correlation)

    // ─── 7. RENDER PAGE ───────────────────────────────
    res.render('insights', {
      parent,
      insight,
      correlation,
      symptoms,
      logs,
      medicines,
      error: null
    })

  } catch (err) {
    console.error('❌ Insights error:', err.message)
    res.render('insights', {
      parent: null,
      insight: null,
      correlation: null,
      symptoms: [],
      logs: [],
      medicines: [],
      error: 'Failed to generate insights. Try again.'
    })
  }
}