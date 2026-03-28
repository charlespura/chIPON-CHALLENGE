import { useEffect, useRef, useState } from 'react'
import { useChiponChallenge } from './useChiponChallenge'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function parseOptionInput(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
}

function calculateChallengeGoal(totalDays) {
  const days = Math.max(1, Number(totalDays) || 1)
  return (days * (days + 1)) / 2
}

function getCurrentStreak(entries) {
  const uniqueDates = [...new Set(entries.map((entry) => entry.date))].sort((left, right) =>
    right.localeCompare(left),
  )

  if (uniqueDates.length === 0) {
    return 0
  }

  let streak = 1
  for (let index = 1; index < uniqueDates.length; index += 1) {
    const current = new Date(`${uniqueDates[index - 1]}T00:00:00`)
    const next = new Date(`${uniqueDates[index]}T00:00:00`)
    const diff = (current.getTime() - next.getTime()) / 86400000

    if (diff !== 1) {
      break
    }

    streak += 1
  }

  return streak
}

function getSuggestion(state, todayEntry) {
  if (!todayEntry) {
    return null
  }

  const gapToGoal = Math.max(0, state.goal - state.totalMoney)
  const nextMilestone = [100, 500, 1000, state.goal].find((value) => value > state.totalMoney) || 0
  const targetGap = nextMilestone ? nextMilestone - state.totalMoney : gapToGoal
  const suggested = state.addonOptions.find((amount) => amount >= targetGap) || state.addonOptions[0]

  if (!suggested) {
    return null
  }

  return targetGap <= suggested
    ? `You are close to the next mark. Add ${formatCurrency(suggested)} today?`
    : `Push this round harder with an extra ${formatCurrency(suggested)}.`
}

function Badge({ active, children }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
        active
          ? 'border-gold/70 bg-gold/20 text-ink'
          : 'border-white/15 bg-white/5 text-white/45'
      }`}
    >
      {children}
    </span>
  )
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-panel backdrop-blur">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/60">{subtext}</p>
    </div>
  )
}

function WheelSpinner({
  items,
  selectedValue,
  isSpinning,
  label,
  renderValue,
  dark = false,
  selectedLabel = 'Selected',
}) {
  const wheelItems = items
  const radius = wheelItems.length > 60 ? 128 : wheelItems.length > 24 ? 122 : 118
  const itemTextClass =
    wheelItems.length > 60
      ? 'text-[7px] px-1 py-0.5 min-w-[22px]'
      : wheelItems.length > 24
        ? 'text-[8px] px-1.5 py-0.5 min-w-[28px]'
        : 'text-[10px] px-2 py-1 min-w-[52px]'

  return (
    <div className={`rounded-[24px] p-4 sm:p-5 ${dark ? 'bg-ink text-parchment' : 'bg-ember text-white'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs uppercase tracking-[0.3em] ${dark ? 'text-gold/80' : 'text-white/70'}`}>
          {label}
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
            dark
              ? 'border-gold/20 bg-gold/10 text-gold/85'
              : 'border-white/20 bg-white/10 text-white/75'
          }`}
        >
          Locked pick
        </span>
      </div>

      <div className="relative mx-auto mt-5 h-72 w-72 max-w-full sm:h-80 sm:w-80">
        <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#f7efe3]" />
        <div
          className={`absolute inset-0 rounded-full border-8 ${
            dark ? 'border-gold/20 bg-[#120f13]' : 'border-white/15 bg-[#8f3c1f]'
          } ${isSpinning ? 'animate-wheel-spin' : ''}`}
          style={{
            backgroundImage: `conic-gradient(
              from 0deg,
              ${dark ? '#2e1f20 0deg 30deg, #4b3131 30deg 60deg, #6a4848 60deg 90deg, #2e1f20 90deg 120deg, #4b3131 120deg 150deg, #6a4848 150deg 180deg, #2e1f20 180deg 210deg, #4b3131 210deg 240deg, #6a4848 240deg 270deg, #2e1f20 270deg 300deg, #4b3131 300deg 330deg, #6a4848 330deg 360deg' : '#c4532d 0deg 30deg, #de7440 30deg 60deg, #f09258 60deg 90deg, #c4532d 90deg 120deg, #de7440 120deg 150deg, #f09258 150deg 180deg, #c4532d 180deg 210deg, #de7440 210deg 240deg, #f09258 240deg 270deg, #c4532d 270deg 300deg, #de7440 300deg 330deg, #f09258 330deg 360deg'}
            )`,
          }}
        >
          {wheelItems.map((item, index) => {
            const angle = (360 / wheelItems.length) * index
            return (
              <div
                key={`${item}-${index}`}
                className="absolute left-1/2 top-1/2 origin-center"
                style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)` }}
              >
                {(() => {
                  const isSelectedSlice = !isSpinning && item === selectedValue
                  return (
                <span
                  className={`block -rotate-[0deg] rounded-full text-center font-semibold uppercase tracking-[0.1em] ${itemTextClass} ${
                    isSelectedSlice
                      ? dark
                        ? 'bg-gold/20 text-gold/70'
                        : 'bg-white/20 text-white/70'
                      : dark
                        ? 'bg-black/30 text-parchment/85'
                        : 'bg-white/15 text-white'
                  }`}
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  {isSelectedSlice ? '•' : renderValue(item)}
                </span>
                  )
                })()}
              </div>
            )
          })}
        </div>
        <div className={`absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 ${
          dark ? 'border-gold/30 bg-ink text-parchment' : 'border-white/25 bg-[#7d2d17] text-white'
        } text-center shadow-[0_0_30px_rgba(0,0,0,0.25)]`}>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.22em] ${dark ? 'text-gold/75' : 'text-white/70'}`}>
              {selectedLabel}
            </p>
            <p className="mt-1 text-2xl font-semibold">{renderValue(selectedValue)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({
  state,
  toggleDisciplineMode,
  saveSettings,
  resetChallenge,
  goalProgress,
  challengeProgress,
}) {
  const [draftDays, setDraftDays] = useState(state.totalDays)
  const [draftOptions, setDraftOptions] = useState(state.addonOptions.join(', '))
  const autoGoal = calculateChallengeGoal(draftDays)

  function handleSaveSettings() {
    saveSettings({
      totalDays: draftDays,
      goal: autoGoal,
      addonOptions: parseOptionInput(draftOptions),
    })
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-black/20 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Challenge Control</p>
          <h2 className="mt-2 text-2xl font-semibold text-parchment">Your rules</h2>
        </div>
        <button
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5"
          onClick={resetChallenge}
        >
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-white/65">Total days</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 transition focus:border-gold/60"
            type="number"
            min="1"
            value={draftDays}
            onChange={(event) => setDraftDays(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/65">Savings goal</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/85 outline-none"
            type="number"
            value={autoGoal}
            readOnly
          />
          <p className="mt-2 text-xs text-white/50">
            Auto-calculated: 1 + 2 + 3 ... + {draftDays || 1}
          </p>
        </label>

        <label className="block">
          <span className="text-sm text-white/65">Add-on options</span>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 transition focus:border-gold/60"
            type="text"
            value={draftOptions}
            onChange={(event) => setDraftOptions(event.target.value)}
            placeholder="5, 10, 15, 20"
          />
        </label>

        <button
          className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#f6c363]"
          onClick={handleSaveSettings}
        >
          Save settings
        </button>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p className="text-sm font-semibold text-parchment">Discipline mode</p>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  state.disciplineMode
                    ? 'border-gold/40 bg-gold/15 text-gold'
                    : 'border-white/10 bg-white/5 text-white/45'
                }`}
              >
                {state.disciplineMode ? 'On' : 'Off'}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Missed days add a <span className="font-semibold text-gold">₱10 penalty</span> per
              skipped day.
            </p>
          </div>
          <button
            onClick={toggleDisciplineMode}
            className={`relative h-10 w-20 shrink-0 self-start rounded-full border transition sm:self-center ${
              state.disciplineMode
                ? 'border-gold/40 bg-gold/20'
                : 'border-white/10 bg-white/5'
            }`}
            aria-pressed={state.disciplineMode}
            aria-label={`Turn discipline mode ${state.disciplineMode ? 'off' : 'on'}`}
          >
            <span
              className={`absolute inset-y-1 left-1 flex w-9 items-center justify-center rounded-full text-[9px] font-semibold uppercase tracking-[0.16em] transition ${
                state.disciplineMode
                  ? 'translate-x-9 bg-gold text-ink'
                  : 'translate-x-0 bg-white text-ink'
              }`}
            >
              {state.disciplineMode ? 'On' : 'Off'}
            </span>
            <span className="sr-only">
              Discipline mode is {state.disciplineMode ? 'on' : 'off'}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Goal progress</span>
          <span>{goalProgress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold" style={{ width: `${goalProgress}%` }} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Challenge progress</span>
          <span>{challengeProgress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${challengeProgress}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function App() {
  const {
    state,
    today,
    todayEntry,
    remainingDays,
    canSpin,
    saveSettings,
    toggleDisciplineMode,
    spin,
    addAddon,
    resetChallenge,
  } = useChiponChallenge()

  const [isSpinning, setIsSpinning] = useState(false)
  const [spinPreview, setSpinPreview] = useState({
    day: todayEntry?.day || '--',
    amount: todayEntry?.mandatory || 0,
  })
  const [isAddonSpinning, setIsAddonSpinning] = useState(false)
  const [addonPreview, setAddonPreview] = useState(state.addonOptions[0] || 0)

  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const addonIntervalRef = useRef(null)
  const addonTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      window.clearInterval(intervalRef.current)
      window.clearTimeout(timeoutRef.current)
      window.clearInterval(addonIntervalRef.current)
      window.clearTimeout(addonTimeoutRef.current)
    }
  }, [])

  const completedCount = state.entries.length
  const currentChallengeDay = Math.min(state.totalDays, completedCount + 1)
  const currentStreak = getCurrentStreak(state.entries)
  const goalProgress = Math.min(100, Math.round((state.totalMoney / state.goal) * 100))
  const challengeProgress = Math.min(100, Math.round((completedCount / state.totalDays) * 100))
  const todayTotal = todayEntry?.total || 0
  const suggestion = getSuggestion(state, todayEntry)
  const latestPenalty = todayEntry?.penalty || 0
  const hasUsedAddonToday = (todayEntry?.addons.length || 0) > 0
  const displayPreview = isSpinning
    ? spinPreview
    : {
        day: todayEntry?.assignedDay || '--',
        amount: todayEntry?.mandatory || 0,
      }
  const addonSummary = todayEntry?.addons.length
    ? `Add-on locked: ${todayEntry.addons.map((amount) => formatCurrency(amount)).join(' + ')}`
    : 'No add-ons placed today.'
  const dayWheelItems = Array.from({ length: state.totalDays }, (_, index) => index + 1)

  const achievements = [
    { label: 'First ₱100', active: state.totalMoney >= 100 },
    { label: '7 Day Streak', active: currentStreak >= 7 },
    { label: 'Halfway Done', active: completedCount >= Math.ceil(state.totalDays / 2) },
  ]

  function handleSpin() {
    if (!canSpin || isSpinning) {
      return
    }

    setIsSpinning(true)
    intervalRef.current = window.setInterval(() => {
      const previewDay =
        remainingDays[Math.floor(Math.random() * remainingDays.length)] || '--'
      const previewAmount = previewDay === '--' ? 0 : previewDay

      setSpinPreview({ day: previewDay, amount: previewAmount })
    }, 90)

    timeoutRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current)
      const entry = spin()

      if (entry) {
        setSpinPreview({ day: entry.assignedDay, amount: entry.mandatory })
      }

      setIsSpinning(false)
    }, 1800)
  }

  function handleAddonSpin() {
    if (!todayEntry || hasUsedAddonToday || isAddonSpinning || state.addonOptions.length === 0) {
      return
    }

    setIsAddonSpinning(true)

    addonIntervalRef.current = window.setInterval(() => {
      const previewAmount =
        state.addonOptions[Math.floor(Math.random() * state.addonOptions.length)] || 0
      setAddonPreview(previewAmount)
    }, 90)

    addonTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(addonIntervalRef.current)
      const amount = state.addonOptions[Math.floor(Math.random() * state.addonOptions.length)] || 0
      setAddonPreview(amount)
      addAddon(amount)
      setIsAddonSpinning(false)
    }, 1800)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,180,76,0.16),_transparent_34%),linear-gradient(135deg,_#2d1511,_#17362f_58%,_#0d1d20)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[36px] border border-white/10 bg-white/10 p-6 shadow-panel backdrop-blur md:p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">ChIPONChallenge</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-serif text-4xl font-semibold leading-none text-parchment md:text-6xl">
                  A gamified daily savings system with mandatory contributions.
                </h1>
                <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
                  Spin once per day, lock in a random savings target, then decide how much extra
                  discipline you want to stack on top.
                </p>
              </div>
              <div className="rounded-[28px] border border-gold/30 bg-black/20 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Today</p>
                <p className="mt-2 text-xl font-semibold">{formatDate(today)}</p>
                <p className="mt-1 text-sm text-white/65">
                  {canSpin ? 'Spin is available.' : 'Today is already locked.'}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Total Saved"
                value={formatCurrency(state.totalMoney)}
                subtext={`${goalProgress}% of ${formatCurrency(state.goal)} auto target`}
              />
              <StatCard
                label="Today Total"
                value={formatCurrency(todayTotal)}
                subtext={
                  todayEntry
                    ? `Challenge day ${todayEntry.challengeDay} is active`
                    : `Waiting for challenge day ${currentChallengeDay}`
                }
              />
              <StatCard
                label="Remaining Days"
                value={`${remainingDays.length}`}
                subtext={`${completedCount}/${state.totalDays} challenge days used`}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-white/10 bg-[#fff7ea] p-6 text-ink">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-wine/70">Spin Chamber</p>
                    <p className="mt-2 text-sm text-ink/60">
                      One spin per calendar day. Random day assignment prevents cherry-picking.
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      Challenge day {currentChallengeDay}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-ink/45">
                      Active range: 1 to {state.totalDays}
                    </p>
                  </div>
                  <div
                    className={`grid h-16 w-16 place-items-center rounded-full border-4 ${
                      isSpinning
                        ? 'animate-spin border-ember border-t-transparent'
                        : 'border-forest/25'
                    }`}
                  >
                    <span className="text-lg font-semibold">{remainingDays.length}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <WheelSpinner
                    items={dayWheelItems}
                    selectedValue={displayPreview.day === '--' ? 1 : displayPreview.day}
                    isSpinning={isSpinning}
                    label="Day Wheel"
                    renderValue={(day) => `${day}`}
                    dark
                    selectedLabel="Pick"
                  />
                </div>

                <div className="mt-4 rounded-[24px] bg-ember p-4 text-white sm:p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Mandatory Save</p>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/75">
                      Locked amount
                    </span>
                  </div>
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-black/15 px-4 py-5 text-center">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">Mandatory Save</p>
                    <p className="mt-2 text-4xl font-semibold sm:text-5xl">
                      {formatCurrency(displayPreview.amount || state.addonOptions[0] || 0)}
                    </p>
                  </div>
                </div>

                {latestPenalty > 0 && (
                  <div className="mt-4 rounded-[24px] border border-wine/20 bg-wine/10 px-4 py-3 text-sm">
                    Discipline mode penalty applied: <strong>{formatCurrency(latestPenalty)}</strong>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-parchment transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={handleSpin}
                    disabled={!canSpin || isSpinning}
                  >
                    {isSpinning ? 'Spinning...' : todayEntry ? 'Spin Locked' : 'Spin Today'}
                  </button>
                  <div className="rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink/55">
                    Locked after spin
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-black/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Add-On Stack</p>
                    <p className="mt-2 text-sm text-white/65">
                      One add-on per day after the mandatory amount is locked in.
                    </p>
                  </div>
                  <p className="text-sm text-white/50">
                    {todayEntry
                      ? hasUsedAddonToday
                        ? '1 add-on used today'
                        : '1 add-on available today'
                      : 'No spin yet'}
                  </p>
                </div>

                <div className="mt-6 rounded-[28px] border border-gold/20 bg-[linear-gradient(135deg,_rgba(240,180,76,0.12),_rgba(255,255,255,0.04))] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-gold/75">Bonus Reel</p>
                      <p className="mt-2 max-w-sm text-sm text-white/70">
                        One inline bonus wheel spin per day after the main spin.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <WheelSpinner
                      items={state.addonOptions}
                      selectedValue={addonPreview || state.addonOptions[0] || 0}
                      isSpinning={isAddonSpinning}
                      label="Bonus Reel Preview"
                      renderValue={(amount) => formatCurrency(amount).replace('₱', '')}
                      selectedLabel="Bonus"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[#f6c363] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleAddonSpin}
                      disabled={!todayEntry || hasUsedAddonToday || isAddonSpinning}
                    >
                      {hasUsedAddonToday
                        ? 'Add-on used today'
                        : isAddonSpinning
                          ? 'Spinning add-on...'
                          : 'Spin add-on'}
                    </button>
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
                      {todayEntry ? addonSummary : 'Finish the main spin first.'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Smart Suggestion</p>
                  <p className="mt-3 text-sm text-white/80">
                    {hasUsedAddonToday
                      ? 'Your one add-on for today is already locked.'
                      : suggestion || 'Spin first to get a suggestion for today.'}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {achievements.map((achievement) => (
                    <Badge key={achievement.label} active={achievement.active}>
                      {achievement.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <SettingsPanel
              key={`${state.totalDays}-${state.goal}-${state.addonOptions.join('-')}`}
              state={state}
              toggleDisciplineMode={toggleDisciplineMode}
              saveSettings={saveSettings}
              resetChallenge={resetChallenge}
              goalProgress={goalProgress}
              challengeProgress={challengeProgress}
            />

            <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-panel backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-gold/80">Daily Log</p>
              <div className="mt-4 space-y-3">
                {state.entries.length === 0 && (
                  <div className="rounded-[24px] border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/55">
                    No entries yet. Your first spin will start the log.
                  </div>
                )}

                {state.entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-parchment">
                          Day {entry.challengeDay}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/45">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gold">{formatCurrency(entry.total)}</p>
                    </div>
                    <p className="mt-3 text-sm text-white/75">
                      Mandatory {formatCurrency(entry.mandatory)}
                      {entry.penalty > 0 ? ` + penalty ${formatCurrency(entry.penalty)}` : ''}
                      {entry.addons.length > 0
                        ? ` + add-ons ${entry.addons.map((item) => formatCurrency(item)).join(', ')}`
                        : ''}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
