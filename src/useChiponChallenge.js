  import { useEffect, useState } from 'react'

const STORAGE_KEY = 'chiponchallenge-state'
const DEFAULT_OPTIONS = [5, 10, 15, 20, 25, 30]
function calculateGoal(totalDays) {
  const days = Math.max(1, Number(totalDays) || 1)
  return (days * (days + 1)) / 2
}

const DEFAULT_STATE = {
  totalDays: 100,
  goal: calculateGoal(100),
  addonOptions: DEFAULT_OPTIONS,
  completedDays: [],
  entries: [],
  totalMoney: 0,
  lastSpinDate: null,
  disciplineMode: false,
}

function getTodayStamp() {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function daysBetween(firstStamp, secondStamp) {
  if (!firstStamp || !secondStamp) {
    return 0
  }

  const first = new Date(`${firstStamp}T00:00:00`)
  const second = new Date(`${secondStamp}T00:00:00`)
  const diff = second.getTime() - first.getTime()

  return Math.round(diff / 86400000)
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function sanitizeOptions(options) {
  const values = options
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)

  return [...new Set(values)].sort((left, right) => left - right)
}

function normalizeEntry(entry, fallbackChallengeDay = 1) {
  const addons = Array.isArray(entry.addons)
    ? entry.addons.map(Number).filter((value) => Number.isFinite(value) && value > 0)
    : []
  const mandatory = Number(entry.mandatory) || 0
  const penalty = Number(entry.penalty) || 0
  const assignedDay = Number(entry.assignedDay ?? entry.day) || 1
  const challengeDay = Number(entry.challengeDay) || fallbackChallengeDay

  return {
    id: entry.id || `${entry.date}-${assignedDay}`,
    assignedDay,
    challengeDay,
    mandatory,
    penalty,
    addons,
    total: mandatory + penalty + addons.reduce((sum, value) => sum + value, 0),
    date: entry.date || getTodayStamp(),
  }
}

function normalizeState(raw) {
  const addonOptions = sanitizeOptions(raw?.addonOptions || DEFAULT_OPTIONS)
  const rawEntries = Array.isArray(raw?.entries) ? raw.entries : []
  const chronologicalEntries = [...rawEntries].sort((left, right) => {
    const leftDate = left?.date || ''
    const rightDate = right?.date || ''
    return leftDate.localeCompare(rightDate)
  })
  const normalizedChronologicalEntries = chronologicalEntries.map((entry, index) =>
    normalizeEntry(entry, index + 1),
  )
  const entries = [...normalizedChronologicalEntries].sort((left, right) =>
    right.date.localeCompare(left.date),
  )
  const completedDays = Array.isArray(raw?.completedDays)
    ? raw.completedDays.map(Number).filter((value) => Number.isFinite(value))
    : entries.map((entry) => entry.assignedDay)

  const totalDays = Math.max(1, Number(raw?.totalDays) || DEFAULT_STATE.totalDays)

  return {
    totalDays,
    goal: calculateGoal(totalDays),
    addonOptions: addonOptions.length ? addonOptions : DEFAULT_OPTIONS,
    completedDays: [...new Set(completedDays)],
    entries,
    totalMoney: entries.reduce((sum, entry) => sum + entry.total, 0),
    lastSpinDate: raw?.lastSpinDate || null,
    disciplineMode: Boolean(raw?.disciplineMode),
  }
}

function loadState() {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeState(JSON.parse(raw)) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function buildRemainingDays(totalDays, completedDays) {
  const used = new Set(completedDays)
  const remaining = []

  for (let day = 1; day <= totalDays; day += 1) {
    if (!used.has(day)) {
      remaining.push(day)
    }
  }

  return remaining
}

export function useChiponChallenge() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const today = getTodayStamp()
  const remainingDays = buildRemainingDays(state.totalDays, state.completedDays)
  const todayEntry = state.entries.find((entry) => entry.date === today) || null
  const canSpin =
    state.lastSpinDate !== today && remainingDays.length > 0 && state.addonOptions.length > 0

  function saveSettings({ totalDays, addonOptions }) {
    const nextTotalDays = Math.max(1, Number(totalDays) || state.totalDays)
    const nextOptions = sanitizeOptions(addonOptions)

    setState((previous) => {
      const normalizedOptions = nextOptions.length ? nextOptions : previous.addonOptions
      const trimmedEntries = previous.entries.filter((entry) => entry.assignedDay <= nextTotalDays)

      return {
        ...previous,
        totalDays: nextTotalDays,
        goal: calculateGoal(nextTotalDays),
        addonOptions: normalizedOptions,
        entries: trimmedEntries,
        completedDays: trimmedEntries.map((entry) => entry.assignedDay),
        totalMoney: trimmedEntries.reduce((sum, entry) => sum + entry.total, 0),
        lastSpinDate:
          previous.lastSpinDate && daysBetween(previous.lastSpinDate, today) < 0
            ? null
            : previous.lastSpinDate,
      }
    })
  }

  function toggleDisciplineMode() {
    setState((previous) => ({
      ...previous,
      disciplineMode: !previous.disciplineMode,
    }))
  }

  function spin() {
    if (!canSpin) {
      return null
    }

    const assignedDay = pickRandom(remainingDays)
    const mandatory = assignedDay
    const skippedDays = Math.max(0, daysBetween(state.lastSpinDate, today) - 1)
    const penalty = state.disciplineMode ? skippedDays * 10 : 0
    const entry = normalizeEntry({
      id: `${today}-${assignedDay}`,
      assignedDay,
      challengeDay: state.entries.length + 1,
      mandatory,
      penalty,
      addons: [],
      date: today,
    })

    setState((previous) => ({
      ...previous,
      completedDays: [...previous.completedDays, assignedDay],
      entries: [entry, ...previous.entries],
      totalMoney: previous.totalMoney + entry.total,
      lastSpinDate: today,
    }))

    return entry
  }

  function addAddon(amount) {
    if (!todayEntry || todayEntry.addons.length > 0) {
      return
    }

    const addon = Number(amount)
    if (!Number.isFinite(addon) || addon <= 0) {
      return
    }

    setState((previous) => {
      const entries = previous.entries.map((entry) => {
        if (entry.id !== todayEntry.id) {
          return entry
        }

        const addons = [...entry.addons, addon]
        return {
          ...entry,
          addons,
          total: entry.mandatory + entry.penalty + addons.reduce((sum, value) => sum + value, 0),
        }
      })

      return {
        ...previous,
        entries,
        totalMoney: entries.reduce((sum, entry) => sum + entry.total, 0),
      }
    })
  }

  function undoLastAddon() {
    if (!todayEntry || todayEntry.addons.length === 0) {
      return
    }

    setState((previous) => {
      const entries = previous.entries.map((entry) => {
        if (entry.id !== todayEntry.id) {
          return entry
        }

        const addons = entry.addons.slice(0, -1)
        return {
          ...entry,
          addons,
          total: entry.mandatory + entry.penalty + addons.reduce((sum, value) => sum + value, 0),
        }
      })

      return {
        ...previous,
        entries,
        totalMoney: entries.reduce((sum, entry) => sum + entry.total, 0),
      }
    })
  }

  function undoTodaySpin() {
    if (!todayEntry) {
      return
    }

    setState((previous) => {
      const entries = previous.entries.filter((entry) => entry.id !== todayEntry.id)
      const hasPreviousEntry = entries.length > 0 ? entries[0] : null

      return {
        ...previous,
        entries,
        completedDays: previous.completedDays.filter((day) => day !== todayEntry.assignedDay),
        totalMoney: entries.reduce((sum, entry) => sum + entry.total, 0),
        lastSpinDate: hasPreviousEntry?.date || null,
      }
    })
  }

  function resetChallenge() {
    setState(DEFAULT_STATE)
  }

  return {
    state,
    today,
    todayEntry,
    remainingDays,
    canSpin,
    saveSettings,
    toggleDisciplineMode,
    spin,
    addAddon,
    undoLastAddon,
    undoTodaySpin,
    resetChallenge,
  }
}
