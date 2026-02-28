import { useMemo, useState, useRef, useEffect } from 'react'
import './App.css'

const QUESTIONS = {
  q1: {
    title: 'What do your adult customers look for in a vape?',
    subtitle: 'Pick 2 options',
    maxSelect: 2,
    options: [
      { value: 'A', label: 'Easy to use' },
      { value: 'B', label: 'Fast charging' },
      { value: 'C', label: 'High puff count' },
      { value: 'D', label: 'Aluminum body' },
    ],
  },
  q2: {
    title: "What are adult customers' main pain points with their vape?",
    subtitle: 'Pick 2 options',
    maxSelect: 2,
    options: [
      { value: 'leaky', label: 'Leaky pods' },
      { value: 'low', label: 'Low puff count' },
      { value: 'charge', label: 'Takes forever to charge' },
      { value: 'bulky', label: 'Too bulky' },
    ],
  },
  q3: {
    title: 'What appeals to your adult customers most?',
    subtitle: 'Pick 1 option',
    maxSelect: 1,
    options: [
      { value: 'A', label: 'Bold and fruity' },
      { value: 'B', label: 'Crisp and fresh' },
      { value: 'C', label: 'Classic and toasty' },
      { value: 'D', label: 'Berrylicious' },
    ],
  },
  q4: {
    title: 'Which flavour mood do your customers gravitate toward?',
    subtitle: 'Pick 1 option',
    maxSelect: 1,
    options: [
      { value: 'A', label: 'Cool and smooth' },
      { value: 'B', label: 'Light and refreshing' },
      { value: 'C', label: 'Warm and familiar' },
      { value: 'D', label: 'Bright and punchy' },
    ],
  },
}

const RECOMMENDATIONS = {
  'VEEV NOW 18mL': {
    A: {
      A: '18 mL Watermelon, Grape, Blue Mint',
      B: '18 mL Watermelon, Grape',
      C: '18 mL Watermelon, Grape, Classic Tobacco',
      D: '18 mL Watermelon, Grape, Blueberry',
    },
    B: {
      A: '18 mL Spearmint, Blue Mint',
      B: '18 mL Spearmint, Blue Mint, Watermelon',
      C: '18 mL Spearmint, Blue Mint, Classic Tobacco',
      D: '18 mL Spearmint, Blue Mint, Blueberry',
    },
    C: {
      A: '18 mL Classic Tobacco, Blue Mint, Spearmint',
      B: '18 mL Classic Tobacco, Watermelon, Grape',
      C: '18 mL Classic Tobacco',
      D: '18 mL Classic Tobacco, Blueberry',
    },
    D: {
      A: '18 mL Blueberry, Blue Mint, Spearmint',
      B: '18 mL Blueberry, Watermelon, Grape',
      C: '18 mL Blueberry, Classic Tobacco',
      D: '18 mL Blueberry',
    },
  },
  'VEEV ONE': {
    A: {
      A: 'V1 Watermelon, Mango, Blue Mint',
      B: 'V1 Watermelon, Mango',
      C: 'V1 Watermelon, Mango, Classic Tobacco',
      D: 'V1 Watermelon, Mango, Blue Raspberry',
    },
    B: {
      A: 'V1 Blue Mint, Spearmint',
      B: 'V1 Blue Mint, Spearmint, Mango',
      C: 'V1 Blue Mint, Spearmint, Classic Tobacco',
      D: 'V1 Blue Mint, Spearmint, Blueberry',
    },
    C: {
      A: 'V1 Classic Tobacco, Blue Mint, Spearmint',
      B: 'V1 Classic Tobacco, Watermelon, Mango',
      C: 'V1 Classic Tobacco',
      D: 'V1 Classic Tobacco, Blueberry, Blue Raspberry',
    },
    D: {
      A: 'V1 Blueberry, Blue Raspberry, Spearmint',
      B: 'V1 Blueberry, Blue Raspberry, Watermelon',
      C: 'V1 Blueberry, Blue Raspberry, Classic Tobacco',
      D: 'V1 Blueberry, Blue Raspberry',
    },
  },
}

const STEPS = ['welcome', 'q1', 'q2', 'q3', 'q4', 'result']

const checkAnswerCombination = (q1Array) => {
  if (q1Array.length < 2) return ''
  const combos = [q1Array[0] + q1Array[1], q1Array[1] + q1Array[0]]
  if (combos.includes('AB') || combos.includes('BC') || combos.includes('AC')) {
    return 'VEEV NOW 18mL'
  }
  if (combos.includes('AD') || combos.includes('BD') || combos.includes('CD')) {
    return 'VEEV ONE'
  }
  return ''
}

function App() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({
    q1: [],
    q2: [],
    q3: '',
    q4: '',
  })
  const [device, setDevice] = useState('')
  const [isFadingOut, setIsFadingOut] = useState(false)
  const appRef = useRef(null)
  const transitionTimeoutRef = useRef(null)
  const autoResetTimeoutRef = useRef(null)
  const [timerKey, setTimerKey] = useState(0)

  const currentStep = STEPS[stepIndex]
  const isQuestion = ['q1', 'q2', 'q3', 'q4'].includes(currentStep)
  const question = isQuestion ? QUESTIONS[currentStep] : null

  const recommendation = useMemo(() => {
    if (!device || !answers.q3 || !answers.q4) return ''
    return RECOMMENDATIONS[device]?.[answers.q3]?.[answers.q4] || ''
  }, [answers.q3, answers.q4, device])

  const clearTimers = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current)
      autoResetTimeoutRef.current = null
    }
  }

  const resetFlow = () => {
    clearTimers()
    setStepIndex(0)
    setAnswers({ q1: [], q2: [], q3: '', q4: '' })
    setDevice('')
    setIsFadingOut(false)
  }

  useEffect(() => {
    const updateViewportVars = () => {
      const doc = document.documentElement
      const layoutWidth = doc.clientWidth || window.innerWidth
      const layoutHeight = doc.clientHeight || window.innerHeight
      const viewport = window.visualViewport

      const width = Math.min(layoutWidth, window.innerWidth)
      const height = viewport
        ? Math.min(layoutHeight, Math.round(viewport.height))
        : layoutHeight

      doc.style.setProperty('--viewport-w', `${width}px`)
      doc.style.setProperty('--viewport-h', `${height}px`)

      const appEl = appRef.current
      const isPhoneViewport = window.matchMedia('(max-width: 640px)').matches

      if (appEl && isPhoneViewport) {
        const appStyles = window.getComputedStyle(appEl)
        const padLeft = parseFloat(appStyles.paddingLeft) || 0
        const padRight = parseFloat(appStyles.paddingRight) || 0
        const padTop = parseFloat(appStyles.paddingTop) || 0
        const padBottom = parseFloat(appStyles.paddingBottom) || 0

        const availableWidth = Math.max(0, appEl.clientWidth - padLeft - padRight)
        const availableHeight = Math.max(0, height - padTop - padBottom)
        const safetyFactor = 0.9
        const calibratedScale = Math.min(
          1,
          Math.max(0.25, Math.min(availableWidth / 650, availableHeight / 1000) * safetyFactor),
        )

        doc.style.setProperty('--device-available-w', `${availableWidth}px`)
        doc.style.setProperty('--device-tablet-scale', `${calibratedScale}`)
      } else {
        doc.style.removeProperty('--device-available-w')
        doc.style.removeProperty('--device-tablet-scale')
      }
    }

    updateViewportVars()
    window.addEventListener('resize', updateViewportVars)
    window.addEventListener('orientationchange', updateViewportVars)

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportVars)
      window.visualViewport.addEventListener('scroll', updateViewportVars)
    }

    return () => {
      window.removeEventListener('resize', updateViewportVars)
      window.removeEventListener('orientationchange', updateViewportVars)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportVars)
        window.visualViewport.removeEventListener('scroll', updateViewportVars)
      }
    }
  }, [])

  useEffect(() => {
    if (!(isQuestion || currentStep === 'result')) {
      clearTimers()
      return
    }

    clearTimers()
    setTimerKey((prev) => prev + 1)
    autoResetTimeoutRef.current = setTimeout(() => {
      setIsFadingOut(true)
      transitionTimeoutRef.current = setTimeout(() => {
        resetFlow()
      }, 500)
    }, 10000)

    return () => {
      clearTimers()
    }
  }, [currentStep, isQuestion])

  const goNext = () => {
    setIsFadingOut(false)
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleStart = () => {
    clearTimers()
    setIsFadingOut(true)
    setTimeout(() => {
      goNext()
    }, 500)
  }

  const handleReset = () => {
    clearTimers()
    setIsFadingOut(true)
    setTimeout(() => {
      resetFlow()
    }, 500)
  }

  const handleMultiSelect = (id, value, maxSelect) => {
    setAnswers((prev) => {
      const current = prev[id]
      const exists = current.includes(value)
      let next = current

      if (exists) {
        next = current.filter((item) => item !== value)
      } else if (current.length < maxSelect) {
        next = [...current, value]
      }

      if (next.length === maxSelect) {
        if (id === 'q1') {
          setDevice(checkAnswerCombination(next))
        }
        if (autoResetTimeoutRef.current) {
          clearTimeout(autoResetTimeoutRef.current)
          autoResetTimeoutRef.current = null
        }
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current)
        }
        setIsFadingOut(true)
        transitionTimeoutRef.current = setTimeout(() => {
          goNext()
          transitionTimeoutRef.current = null
        }, 500)
      }

      return { ...prev, [id]: next }
    })
  }

  const handleSingleSelect = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current)
      autoResetTimeoutRef.current = null
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    setIsFadingOut(true)
    transitionTimeoutRef.current = setTimeout(() => {
      goNext()
      transitionTimeoutRef.current = null
    }, 500)
  }

  const getScreenImage = () => {
    const screenMap = {
      welcome: 'screen_1.png',
      q1: 'screen_2.png',
      q2: 'screen_3.png',
      q3: 'screen_4.png',
      q4: 'screen_5.png',
      result: 'screen_6.png',
    }
    return screenMap[currentStep] || null
  }

  return (
    <div className="app" ref={appRef}>
      <div className="tablet-frame">
        <div className="tablet">
          <main className="content">
          {currentStep === 'welcome' && (
            <section className={`panel ${isFadingOut ? 'fade-out' : ''}`} key="welcome">
              <img src={getScreenImage()} alt="Screen 1" className="screen-image" />
              <div className="welcome-text">
                <h1 className="welcome-title">
                  <span className="welcome-title-main">
                    FIND THE
                    <br />
                    VEEV VAPE
                    <br />
                    AND FLAVOUR
                  </span>
                  <span className="welcome-title-sub">FOR YOUR ADULT CUSTOMERS!</span>
                </h1>
              </div>
              <button className="cta" onClick={handleStart}>
                START
              </button>
            </section>
          )}

          {isQuestion && (
            <section className={`panel ${isFadingOut ? 'fade-out' : ''}`} key={currentStep}>
              <img src={getScreenImage()} alt={`Screen ${stepIndex + 1}`} className="screen-image" />
              <h2>{question.title}</h2>
              <div className="option-grid">
                {question.options.map((option) => {
                  const selected = Array.isArray(answers[currentStep])
                    ? answers[currentStep].includes(option.value)
                    : answers[currentStep] === option.value

                  const onClick = () =>
                    question.maxSelect === 1
                      ? handleSingleSelect(currentStep, option.value)
                      : handleMultiSelect(
                          currentStep,
                          option.value,
                          question.maxSelect,
                        )

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`option-button ${selected ? 'selected' : ''}`}
                      onClick={onClick}
                    >
                      <span className="option-label">{option.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="instruction-footer">
                <span className="pill timer-pill" key={`timer-${currentStep}-${timerKey}`}>
                  <span className="pill-text">{question.subtitle}</span>
                </span>
              </div>
            </section>
          )}

          {currentStep === 'result' && (
            <section className={`panel result-panel ${isFadingOut ? 'fade-out' : ''}`} key="result">
              <img src={getScreenImage()} alt="Screen 6" className="screen-image" />
              <div className="welcome-text result-text">
                <p className="eyebrow">
                  Suggested product and<br />
                  flavour package
                </p>
                <h2>
                  {device || 'VEEV'}{' '}
                  {recommendation.replace(/^(18 mL|V1) /, '')}
                </h2>
              </div>
              <div className="cta-row">
                <button
                  className="ghost timer-pill"
                  type="button"
                  onClick={handleReset}
                  key={`timer-${currentStep}-${timerKey}`}
                >
                  <span className="pill-text">Start Over</span>
                </button>
              </div>
            </section>
          )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
