import { useMemo, useState, useRef, useEffect } from 'react'
import './App.css'
import screen1 from './assets/screen_1.png'
import screen2 from './assets/screen_2.png'
import screen3 from './assets/screen_3.png'
import screen4 from './assets/screen_4.png'
import screen5 from './assets/screen_5.png'
import screen6 from './assets/screen_6.png'
import warningImg from './assets/warning.png'

const SHEETS_WEB_APP_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL || ''
const FALLBACK_RECOMMENDATION = 'VEEV NOW ULTRA Classic Mint'

const QUESTIONS = {
  q1: {
    title: 'What do you look for in a vape?',
    subtitle: 'Pick 2 options',
    maxSelect: 2,
    options: [
      { value: 'A', label: 'Easy to use' },
      { value: 'B', label: 'Fast charging' },
      { value: 'C', label: 'High puff count' },
      { value: 'D', label: 'Aluminum body' },
      { value: 'E', label: 'Easy pod swaps' },
    ],
  },
  q2: {
    title: "What don't you like about your current vape?",
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
    title: 'What appeals to you the most?',
    subtitle: 'Pick 1 option',
    maxSelect: 1,
    options: [
      { value: 'A', label: 'Bold and Fruity' },
      { value: 'B', label: 'Crisp and Fresh' },
      { value: 'C', label: 'Classic and Rich' },
      { value: 'D', label: 'Roasted and Creamy' },
    ],
  },
  q4: {
    title: "What's your flavour mood?",
    subtitle: 'Pick 1 option',
    maxSelect: 1,
    options: [
      { value: 'A', label: 'Cool and Smooth' },
      { value: 'B', label: 'Light and Refreshing' },
      { value: 'C', label: 'Warm and Familiar' },
      { value: 'D', label: 'Strong and Punchy' },
    ],
  },
}

const RECOMMENDATIONS = {
  'VEEV NOW ULTRA': {
    A: {
      A: 'VEEV NOW ULTRA Classic Mint',
      B: 'VEEV NOW ULTRA Classic Mint',
      C: 'VEEV NOW ULTRA Gold Tobacco, Auburn Tobacco',
      D: 'VEEV NOW ULTRA Accents Rich Tobacco',
    },
    B: {
      A: 'VEEV NOW ULTRA Classic Mint',
      B: 'VEEV NOW ULTRA Classic Mint',
      C: 'VEEV NOW ULTRA Classic Mint, Gold Tobacco, Auburn Tobacco',
      D: 'VEEV NOW ULTRA Classic Mint, Accents Rich Tobacco',
    },
    C: {
      A: 'VEEV NOW ULTRA Classic Mint, Accents Rich Tobacco',
      B: 'VEEV NOW ULTRA Classic Mint, Accents Rich Tobacco',
      C: 'VEEV NOW ULTRA Gold Tobacco, Auburn Tobacco, Accents Rich Tobacco',
      D: 'VEEV NOW ULTRA Accents Rich Tobacco',
    },
    D: {
      A: 'VEEV NOW ULTRA Classic Mint, Gold Tobacco, Auburn Tobacco',
      B: 'VEEV NOW ULTRA Classic Mint, Gold Tobacco, Auburn Tobacco',
      C: 'VEEV NOW ULTRA Gold Tobacco, Auburn Tobacco',
      D: 'VEEV NOW ULTRA Gold Tobacco, Auburn Tobacco, Accents Rich Tobacco',
    },
  },
  'VEEV ONE': {
    A: {
      A: 'VEEV ONE Watermelon, Mango, Blue Mint',
      B: 'VEEV ONE Watermelon, Mango, Strawberry',
      C: 'VEEV ONE Watermelon, Mango, Classic Tobacco',
      D: 'VEEV ONE Watermelon, Mango, Blue Raspberry',
    },
    B: {
      A: 'VEEV ONE Blue Mint, Spearmint, Ice Mint',
      B: 'VEEV ONE Blue Mint, Spearmint, Strawberry',
      C: 'VEEV ONE Blue Mint, Spearmint, Classic Tobacco',
      D: 'VEEV ONE Blue Mint, Spearmint, Blue Raspberry',
    },
    C: {
      A: 'VEEV ONE Classic Tobacco, Blue Mint, Spearmint',
      B: 'VEEV ONE Classic Tobacco, Strawberry, Watermelon',
      C: 'VEEV ONE Classic Tobacco, Toasted Tobacco, Bright Tobacco',
      D: 'VEEV ONE Classic Tobacco, Blue Raspberry, Mango',
    },
    D: {
      A: 'VEEV ONE Mild Tobacco, Blue Mint, Spearmint',
      B: 'VEEV ONE Mild Tobacco, Strawberry, Classic Mint',
      C: 'VEEV ONE Classic Tobacco, Mild Tobacco, Bright Tobacco',
      D: 'VEEV ONE Toasted Tobacco, Classic Tobacco, Blue Raspberry',
    },
  },
}

const getLabel = (questionId, value) => {
  const q = QUESTIONS[questionId]
  if (!q) return value
  const opt = q.options.find((o) => o.value === value)
  return opt ? opt.label : value
}

const STEPS = ['welcome', 'q1', 'q2', 'q3', 'q4', 'result']

const createFlowId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const getOptionLabel = (questionId, value) => {
  const option = QUESTIONS[questionId]?.options?.find((item) => item.value === value)
  return option?.label || ''
}

const getSuggestionItems = (recommendationText) => {
  const text = recommendationText || FALLBACK_RECOMMENDATION
  const prefix = text.match(/^(VEEV NOW ULTRA|VEEV ONE)/)?.[0] || 'VEEV NOW ULTRA'
  const flavors = text.replace(/^(VEEV NOW ULTRA|VEEV ONE) /, '').split(', ')
  return flavors.map((flavor) => `${prefix} ${flavor}`)
}

const isLikelyDuplicateSubmission = (fingerprint) => {
  const lastFingerprint = sessionStorage.getItem('veev-last-sheet-fingerprint')
  const lastAtRaw = sessionStorage.getItem('veev-last-sheet-submission-at')
  const lastAt = Number(lastAtRaw || 0)
  const now = Date.now()

  if (lastFingerprint === fingerprint && now - lastAt < 5000) {
    return true
  }

  sessionStorage.setItem('veev-last-sheet-fingerprint', fingerprint)
  sessionStorage.setItem('veev-last-sheet-submission-at', String(now))
  return false
}

const sendResultToGoogleSheet = async ({
  answers,
  recommendation,
  suggestionClicked = '',
  flowId = '',
  eventType = 'result_reached',
}) => {
  if (!SHEETS_WEB_APP_URL) {
    console.warn('VITE_SHEETS_WEB_APP_URL is not set. Sheet logging is disabled.')
    return
  }

  const isCompletedFlow =
    Array.isArray(answers.q1) &&
    answers.q1.length === 2 &&
    Array.isArray(answers.q2) &&
    answers.q2.length === 2 &&
    Boolean(answers.q3) &&
    Boolean(answers.q4)

  if (!isCompletedFlow) {
    return
  }

  const q1Answers = (answers.q1 || []).map((value) => getOptionLabel('q1', value))
  const q2Answers = (answers.q2 || []).map((value) => getOptionLabel('q2', value))
  const suggestions = getSuggestionItems(recommendation)

  const row = {
    datetimestamp: new Date().toISOString(),
    flow_id: flowId,
    'flow id': flowId,
    event_type: eventType,
    'event type': eventType,
    question_1_answer_1: q1Answers[0] || '',
    'question 1 answer 1': q1Answers[0] || '',
    question_1_answer_2: q1Answers[1] || '',
    'question 1 answer 2': q1Answers[1] || '',
    question_2_answer_1: q2Answers[0] || '',
    'question 2 answer 1': q2Answers[0] || '',
    question_2_answer_2: q2Answers[1] || '',
    'question 2 answer 2': q2Answers[1] || '',
    question_3_answer: getOptionLabel('q3', answers.q3),
    'question 3 answer': getOptionLabel('q3', answers.q3),
    question_4_answer: getOptionLabel('q4', answers.q4),
    'question 4 answer': getOptionLabel('q4', answers.q4),
    final_suggestion_1: suggestions[0] || '',
    'final suggestion 1': suggestions[0] || '',
    final_suggestion_2: suggestions[1] || '',
    'final suggestion 2': suggestions[1] || '',
    final_suggestion_3: suggestions[2] || '',
    'final suggestion 3': suggestions[2] || '',
    final_suggestion_4: suggestions[3] || '',
    'final suggestion 4': suggestions[3] || '',
    suggestion_clicked: suggestionClicked,
    'suggestion clicked': suggestionClicked,
    suggestionClicked,
  }

  const fingerprint = JSON.stringify({
    flowId,
    eventType,
    q1: q1Answers,
    q2: q2Answers,
    q3: row.question_3_answer,
    q4: row.question_4_answer,
    suggestions,
    suggestionClicked,
  })

  if (isLikelyDuplicateSubmission(fingerprint)) {
    return
  }

  await fetch(SHEETS_WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(row),
  })
}

const checkAnswerCombination = (q1Array) => {
  if (q1Array.length < 2) return ''
  const combos = [q1Array[0] + q1Array[1], q1Array[1] + q1Array[0]]
  if (combos.includes('AC') || combos.includes('CD')) {
    return 'VEEV NOW ULTRA'
  }
  return 'VEEV ONE'
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
  const [shouldExpandTimer, setShouldExpandTimer] = useState(false)
  const [previousImage, setPreviousImage] = useState(null)
  const [isImageTransitioning, setIsImageTransitioning] = useState(false)
  const appRef = useRef(null)
  const transitionTimeoutRef = useRef(null)
  const autoResetTimeoutRef = useRef(null)
  const imageTransitionTimeoutRef = useRef(null)
  const flowIdRef = useRef('')
  const [timerKey, setTimerKey] = useState(0)
  const hasLoggedCurrentResultRef = useRef(false)
  const currentResultFlowIdRef = useRef('')

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
    if (imageTransitionTimeoutRef.current) {
      clearTimeout(imageTransitionTimeoutRef.current)
      imageTransitionTimeoutRef.current = null
    }
  }

  const resetFlow = () => {
    clearTimers()
    setStepIndex(0)
    setAnswers({ q1: [], q2: [], q3: '', q4: '' })
    setDevice('')
    setIsFadingOut(false)
    setShouldExpandTimer(false)
    setPreviousImage(null)
    setIsImageTransitioning(false)
  }

  useEffect(() => {
    const preloadImages = async () => {
      const imageUrls = [screen1, screen2, screen3, screen4, screen5, screen6]
      const preloadPromises = imageUrls.map((src) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            if (img.decode) {
              img.decode().then(resolve).catch(resolve)
            } else {
              resolve()
            }
          }
          img.onerror = resolve
          img.src = src
        })
      })
      await Promise.all(preloadPromises)
    }
    preloadImages()
  }, [])

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
      transitionToWelcome()
    }, 30000)

    return () => {
      clearTimers()
    }
  }, [currentStep, isQuestion])

  useEffect(() => {
    if (currentStep === 'result') {
      setIsFadingOut(false)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep !== 'result') {
      hasLoggedCurrentResultRef.current = false
      currentResultFlowIdRef.current = ''
      return
    }

    if (hasLoggedCurrentResultRef.current) {
      return
    }

    const flowId = createFlowId()
    hasLoggedCurrentResultRef.current = true
    currentResultFlowIdRef.current = flowId

    sendResultToGoogleSheet({
      answers,
      recommendation,
      suggestionClicked: '',
      flowId,
      eventType: 'result_reached',
    }).catch((error) => {
      console.error('Failed to send result reach event to Google Sheet', error)
    })
  }, [answers, currentStep, recommendation])

  const captureTimerState = () => {
    // Find the timer pill element and capture its current width
    const timerPill = document.querySelector('.timer-pill')
    if (timerPill) {
      const afterElement = window.getComputedStyle(timerPill, '::after')
      const currentWidth = afterElement.getPropertyValue('width')
      const containerWidth = timerPill.offsetWidth
      // Calculate percentage
      const widthPx = parseFloat(currentWidth)
      const widthPercent = (widthPx / containerWidth) * 100
      timerPill.style.setProperty('--current-width', `${widthPercent}%`)
    }
  }

  const startImageTransition = () => {
    const currentImage = getScreenImage()
    setPreviousImage(currentImage)
  }

  const runImageCrossfade = () => {
    setTimeout(() => {
      setIsImageTransitioning(true)

      if (imageTransitionTimeoutRef.current) {
        clearTimeout(imageTransitionTimeoutRef.current)
      }
      imageTransitionTimeoutRef.current = setTimeout(() => {
        setPreviousImage(null)
        setIsImageTransitioning(false)
      }, 500)
    }, 50)
  }

  const goNext = () => {
    setIsFadingOut(false)
    setShouldExpandTimer(false)
    const nextIndex = Math.min(stepIndex + 1, STEPS.length - 1)
    setStepIndex(nextIndex)
    runImageCrossfade()
  }

  const transitionToWelcome = () => {
    clearTimers()
    startImageTransition()
    setIsFadingOut(true)
    setShouldExpandTimer(false)

    transitionTimeoutRef.current = setTimeout(() => {
      setStepIndex(0)
      setAnswers({ q1: [], q2: [], q3: '', q4: '' })
      setDevice('')
      setIsFadingOut(false)
      setShouldExpandTimer(false)
      runImageCrossfade()
      transitionTimeoutRef.current = null
    }, 500)
  }

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleStart = () => {
    clearTimers()
    // Don't capture timer state from welcome screen since it doesn't have a timer
    startImageTransition()
    setIsFadingOut(true)
    setTimeout(() => {
      goNext()
    }, 500)
  }

  const handleReset = (suggestionClicked = '') => {
    if (currentStep === 'result' && suggestionClicked) {
      sendResultToGoogleSheet({
        answers,
        recommendation,
        suggestionClicked,
        flowId: currentResultFlowIdRef.current,
        eventType: 'suggestion_clicked',
      }).catch((error) => {
        console.error('Failed to send suggestion click event to Google Sheet', error)
      })
    }

    transitionToWelcome()
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
        captureTimerState()
        startImageTransition()
        setShouldExpandTimer(true)
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
    captureTimerState()
    startImageTransition()
    setShouldExpandTimer(true)
    setIsFadingOut(true)
    transitionTimeoutRef.current = setTimeout(() => {
      goNext()
      transitionTimeoutRef.current = null
    }, 500)
  }

  const getScreenImage = () => {
    const screenMap = {
      welcome: screen1,
      q1: screen2,
      q2: screen3,
      q3: screen4,
      q4: screen5,
      result: screen6,
    }
    return screenMap[currentStep] || null
  }

  return (
    <div className="app" ref={appRef}>
      <div className="tablet-frame">
        <div className="tablet">
          <img src={warningImg} alt="Health warning" className="warning-banner" />
          <main className="content">
          {currentStep === 'welcome' && (
            <section className={`panel ${isFadingOut ? 'fade-out' : ''}`} key="welcome">
              {previousImage && <img src={previousImage} alt="Previous screen" className="screen-image screen-image-previous" />}
              <img 
                src={getScreenImage()} 
                alt="Screen 1" 
                className={`screen-image${previousImage ? ' screen-image-new' : ''}${isImageTransitioning ? ' screen-image-transitioning' : ''}`} 
              />
              <div className="welcome-text">
                <h1 className="welcome-title">
                  <span className="welcome-title-sub">
                    WHAT'S THE BEST
                  </span>
                  <span className="welcome-title-main">
                    VEEV VAPE
                    <br />
                    AND FLAVOUR
                  </span>
                  <span className="welcome-title-sub">FOR YOU?</span>
                </h1>
              </div>
              <button className="cta" onClick={handleStart}>
                LET'S FIND<br />OUT!
              </button>
            </section>
          )}

          {isQuestion && (
            <section className={`panel${currentStep === 'q1' ? ' panel-q1' : ''} ${isFadingOut ? 'fade-out' : ''}`} key={currentStep}>
              {previousImage && <img src={previousImage} alt="Previous screen" className="screen-image screen-image-previous" />}
              <img 
                src={getScreenImage()} 
                alt={`Screen ${stepIndex + 1}`} 
                className={`screen-image${previousImage ? ' screen-image-new' : ''}${isImageTransitioning ? ' screen-image-transitioning' : ''}`}
              />
              <div className="question-header">
                <p className="question-title" dangerouslySetInnerHTML={{__html: `Q${currentStep.slice(1)}: ${question.title}`}} />
                {question.maxSelect === 2 && (
                  <h2 className="question-prompt">Pick 2 of the<br />following options</h2>
                )}
                {question.maxSelect === 1 && (
                  <h2 className="question-prompt">Pick 1 of the<br />following options</h2>
                )}
              </div>
              <div className="option-grid">
                {question.options.map((option, index) => {
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
                      <span className="option-label">{String.fromCharCode(65 + index)}) {option.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className={`instruction-footer${shouldExpandTimer ? ' timer-expanding' : ''}${currentStep !== 'q1' ? ' timer-persistent' : ''}`}>
                <span className={`pill timer-pill${shouldExpandTimer ? ' timer-pill-expanding' : ''}`} key={`timer-${currentStep}-${timerKey}`} aria-hidden="true" />
              </div>
            </section>
          )}

          {currentStep === 'result' && (
            <section className={`panel result-panel ${isFadingOut ? 'fade-out' : ''}`} key="result">
              {previousImage && <img src={previousImage} alt="Previous screen" className="screen-image screen-image-previous" />}
              <img 
                src={getScreenImage()} 
                alt="Screen 6" 
                className={`screen-image${previousImage ? ' screen-image-new' : ''}${isImageTransitioning ? ' screen-image-transitioning' : ''}`}
              />
              <div className="result-header">
                <h2 className="result-prompt">
                  Your suggested VEEV Vape<br />
                  and flavours are
                </h2>
              </div>
              <div className="result-options">
                {(recommendation || FALLBACK_RECOMMENDATION).replace(/^(VEEV NOW ULTRA|VEEV ONE) /, '').split(', ').map((flavor, index) => {
                  const prefix = (recommendation || FALLBACK_RECOMMENDATION).match(/^(VEEV NOW ULTRA|VEEV ONE)/)?.[0] || 'VEEV NOW ULTRA'
                  const suggestionLabel = `${prefix} ${flavor}`
                  return (
                    <button key={index} type="button" className="result-button" onClick={() => handleReset(suggestionLabel)}>
                      <span className="result-label">{suggestionLabel}</span>
                    </button>
                  )
                })}
              </div>
              <div className={`instruction-footer${shouldExpandTimer ? ' timer-expanding' : ''}${currentStep !== 'q1' ? ' timer-persistent' : ''}`}>
                <span className={`pill timer-pill${shouldExpandTimer ? ' timer-pill-expanding' : ''}`} key={`timer-${currentStep}-${timerKey}`} aria-hidden="true" />
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
