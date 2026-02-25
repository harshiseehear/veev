import { useMemo, useState } from 'react'
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

  const currentStep = STEPS[stepIndex]
  const isQuestion = ['q1', 'q2', 'q3', 'q4'].includes(currentStep)
  const question = isQuestion ? QUESTIONS[currentStep] : null

  const recommendation = useMemo(() => {
    if (!device || !answers.q3 || !answers.q4) return ''
    return RECOMMENDATIONS[device]?.[answers.q3]?.[answers.q4] || ''
  }, [answers.q3, answers.q4, device])

  const resetFlow = () => {
    setStepIndex(0)
    setAnswers({ q1: [], q2: [], q3: '', q4: '' })
    setDevice('')
  }

  const goNext = () => {
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
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
        goNext()
      }

      return { ...prev, [id]: next }
    })
  }

  const handleSingleSelect = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    goNext()
  }

  return (
    <div className="app">
      <div className="tablet">
        <main className="content">
          {currentStep === 'welcome' && (
            <section className="panel">
              <p className="eyebrow">Welcome</p>
              <h1>Find the VEEV vape and flavour for your adult customers!</h1>
              <p className="lead">
                Answer a few quick questions to match the right device and
                flavour package.
              </p>
              <button className="cta" onClick={goNext}>
                Start
              </button>
            </section>
          )}

          {isQuestion && (
            <section className="panel">
              <div className="progress">
                <span>
                  Question {stepIndex} of 4
                </span>
                <span className="pill">{question.subtitle}</span>
              </div>
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
              <div className="nav-row">
                <button className="ghost" type="button" onClick={goBack}>
                  Back
                </button>
                <button className="ghost" type="button" onClick={resetFlow}>
                  Start over
                </button>
              </div>
            </section>
          )}

          {currentStep === 'result' && (
            <section className="panel">
              <p className="eyebrow">Suggested product and flavour package</p>
              <h2>{device || 'VEEV'}</h2>
              <p className="result-flavors">{recommendation}</p>
              <div className="cta-row">
                <button className="cta" type="button">
                  Shop Now
                </button>
                <button className="ghost" type="button" onClick={resetFlow}>
                  Start Over
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
