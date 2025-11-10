import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import LogoAsset from './assets/leeila-logo.svg'
import SudarshanWidget from './components/SudarshanWidget'
import type {
  WidgetIntegration,
  WidgetPackage,
} from './components/SudarshanWidget'
import './components/SudarshanWidget.css'
import type {
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from './types/speech'

type ConversationFlow = 'none' | 'sales' | 'onboarding' | 'support'
type MessageSender = 'assistant' | 'user'

interface QuickReply {
  label: string
  payload?: string
  onSelect?: () => void
  type?: 'primary' | 'secondary'
  skipFlowHandling?: boolean
}

type MessageVariant = 'packages' | 'cta' | 'summary' | 'widget'

interface Message {
  id: string
  sender: MessageSender
  content: string
  timestamp: string
  variant?: MessageVariant
  data?: unknown
  quickReplies?: QuickReply[]
}

interface PackageOffer {
  id: string
  label: string
  price: string
  description: string
  billing?: string
}

interface SalesLead {
  packageInterest?: string
  name?: string
  phone?: string
  businessType?: string
  city?: string
}

interface WidgetMessageData {
  title: string
  greet1: string
  greet2: string
  ctaRegister: string
  packages: WidgetPackage[]
  packageOptions: Array<{ label: string; value: string }>
  selectedPackage?: string
  integration?: WidgetIntegration
}

type SalesStep =
  | 'idle'
  | 'askPackage'
  | 'askName'
  | 'askPhone'
  | 'askBusinessType'
  | 'askCity'
  | 'review'

interface OnboardingData {
  track?: string
  ownerName?: string
  businessName?: string
  phone?: string
  city?: string
  state?: string
  businessType?: string
  yearsInBusiness?: string
  existingRegistration?: string
  revenueBand?: string
}

type OnboardingStep =
  | 'idle'
  | 'askTrack'
  | 'askOwnerName'
  | 'askStoreName'
  | 'askContact'
  | 'askLocationCity'
  | 'askLocationState'
  | 'askBusinessType'
  | 'askYears'
  | 'askExistingReg'
  | 'askRevenueBand'
  | 'review'

interface UserProfile {
  name?: string
  phone?: string
}

type IntroStep = 'askNeed' | 'askName' | 'askPhone' | 'completed'

interface SupportTicket {
  topic?: string
  issueDescription?: string
  urgency?: string
  preferredChannel?: string
}

type SupportStep =
  | 'idle'
  | 'askTopic'
  | 'askIssue'
  | 'askUrgency'
  | 'askChannel'
  | 'review'

type VoiceLocale = 'hi-IN' | 'en-IN'

const packages: PackageOffer[] = [
  {
    id: 'tech-swaraj',
    label: '🌱 Tech Swaraj Pack',
    price: '₹89 (one-time)',
    description: '1-page digital store launch + Udyam/MSME registration support',
  },
  {
    id: 'kick-start',
    label: '🚀 Kick-Start Pack',
    price: '₹499',
    description: 'SEO basics + WhatsApp welcome journey + conversion landing page',
  },
  {
    id: 'vyapari-udaan',
    label: '🏪 Vyapari Udaan Pack',
    price: '₹889',
    description: 'Full digital store + SEO setup + starter marketing creatives',
  },
  {
    id: 'social-booster',
    label: '📱 Social Booster Pack',
    price: '₹999/mo',
    description: 'Managed social media calendars, posts, and engagement nudges',
    billing: 'Monthly retainership',
  },
  {
    id: 'digital-dominator',
    label: '💎 Digital Dominator Pack',
    price: '₹1399/mo',
    description: 'Paid ads + influencer tie-ups + website refresh for conversions',
    billing: 'Monthly retainership',
  },
  {
    id: 'growth-pro',
    label: '📈 Growth Pro Pack',
    price: '₹1599',
    description: '5-page site + SEO + AI chatbot + blog engine setup',
  },
  {
    id: 'tez-raftar',
    label: '⚡ Tez Raftar Booster',
    price: '₹1899/mo',
    description: 'Website care + SEO optimisation + WhatsApp automation journeys',
    billing: 'Monthly retainership',
  },
]

const stripPrefixIcon = (value: string) =>
  value.replace(/^[^\w\u0900-\u097F]+/, '').trim()

const toWidgetPackage = (offer: PackageOffer): WidgetPackage => ({
  id: offer.id,
  title: stripPrefixIcon(offer.label),
  price: offer.price,
  note: offer.description,
})

const toWidgetPackageOption = (offer: PackageOffer) => ({
  value: offer.id,
  label: `${stripPrefixIcon(offer.label)} • ${offer.price}`,
})

const widgetIntegration: WidgetIntegration = {
  via: 'n8n',
  service: 'google_sheets.append_row',
  sheetId: 'LEADS_SHEET_ID',
  worksheet: 'Sudarshan Leads',
  fields: [
    'timestamp',
    'lead.name',
    'lead.phone',
    'lead.businessType',
    'lead.city',
    'lead.package',
    'source',
  ],
}

const widgetStaticData: Omit<WidgetMessageData, 'selectedPackage'> = {
  title: 'Pricing & bundle offers',
  greet1: 'Namaste! Ready to take your vyapar online?',
  greet2: 'Pick a pack below or drop your details for a personalised callback.',
  ctaRegister: 'Register shop for ₹89',
  packages: packages.map(toWidgetPackage),
  packageOptions: packages.map(toWidgetPackageOption),
  integration: widgetIntegration,
}

const registrationTracks = ['Udyam/MSME', 'GST', 'Sudarshan Portal']

const businessTypeOptions = [
  'Retail',
  'Service',
  'Manufacturing',
  'Hospitality',
  'Creator',
  'Other',
]

const yearOptions = ['0-6 months', '1-3 years', '3-5 years', '5+ years']

const revenueBandOptions = [
  'Under ₹5L',
  '₹5L - ₹25L',
  '₹25L - ₹1Cr',
  '₹1Cr+',
]

const supportTopics = [
  'Billing & Payments',
  'Technical issue',
  'Training & onboarding',
  'Project status update',
  'Talk to an expert',
  'Other',
]

const supportUrgencyOptions = ['Low', 'Normal', 'High']

const supportChannelOptions = ['Call', 'WhatsApp', 'Email']

const supportFaqs: Array<{ keywords: string[]; answer: string; followUp?: string }> = [
  {
    keywords: ['price', 'pricing', 'cost', 'pack', 'package'],
    answer:
      'Hamara pricing packs me structured hai — Tech Swaraj ₹89 one-time se start hota hai aur premium retainers ₹999/mo se. Main aapko detailed packs abhi dikha sakti hoon.',
    followUp: 'Kya main packages ka snapshot bheju ya sales specialist se connect karu?',
  },
  {
    keywords: ['payment', 'invoice', 'billing'],
    answer:
      'Payments hum Razorpay aur bank transfer dono accept karte hain. Invoice har payment ke baad auto-generate hota hai aur aapke registered email par share hota hai.',
    followUp: 'Agar kisi invoice me correction chahiye to bataiye, main ticket raise kar dungi.',
  },
  {
    keywords: ['support', 'issue', 'problem', 'error', 'bug'],
    answer:
      'Main technical issues log karne me madad karungi. Bas mujhe feature ka naam aur issue ka short summary bata dijiye.',
    followUp: 'Kya aap support ticket raise karna chahenge?',
  },
  {
    keywords: ['training', 'demo', 'guide', 'documentation'],
    answer:
      'Humne onboarding ke liye Hindi/English video walkthroughs aur quickstart playbooks banaye hain. Zarurat pade to live training slot bhi schedule kar sakte hain.',
    followUp: 'Kya main aapko training scheduler link bheju ya kisi specialist se connect karu?',
  },
  {
    keywords: ['status', 'progress', 'update', 'timeline'],
    answer:
      'Project status ke liye hum Monday-Wednesday-Friday updates bhejte hain. Agar aapko realtime snapshot chahiye to main account manager se quick callback schedule kara sakti hoon.',
    followUp: 'Kya aap callback prefer karenge ya email summary?',
  },
]

const matchSupportFaq = (text: string) => {
  const lowered = text.toLowerCase()
  return supportFaqs.find((faq) =>
    faq.keywords.some((keyword) => lowered.includes(keyword.toLowerCase())),
  )
}

const getFlowAcknowledgement = (flow: ConversationFlow, profile?: UserProfile) => {
  const namePart = profile?.name ? ` ${profile.name}` : ''
  switch (flow) {
    case 'sales':
      return `Samajh gayi${namePart}! Sales consultation ke liye taiyar hoon.`
    case 'onboarding':
      return `Great${namePart}! Onboarding/registration steps me main aapko guide karungi.`
    case 'support':
      return `Bilkul${namePart}! Customer care desk ready hai, bas kuch details chahiye.`
    default:
      return `Great${namePart}!`
  }
}

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const normalise = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '')

const formatTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const extractValidPhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10) {
    return null
  }
  return digits.slice(-10)
}

const detectLocale = (value: string): VoiceLocale =>
  /[\u0900-\u097F]/.test(value) ? 'hi-IN' : 'en-IN'

const summariseMessageForSpeech = (message: Message): string => {
  if (message.variant === 'packages' && Array.isArray(message.data)) {
    const offers = (message.data as PackageOffer[]).slice(0, 5)
    const composed = offers
      .map((offer) => {
        const labelWithoutEmoji = offer.label.replace(/^[^\w\u0900-\u097F]+/, '').trim()
        return `${labelWithoutEmoji}: ${offer.price}`
      })
      .join('. ')
    return `${message.content}. ${composed}.`
  }

  if (
    message.variant === 'summary' &&
    Array.isArray(message.data) &&
    (message.data as Array<{ label: string; value: string }>).length > 0
  ) {
    const rows = message.data as Array<{ label: string; value: string }>
    const flattened = rows
      .map((row) => {
        const value = row.value && row.value !== '—' ? row.value : 'provide nahi kiya'
        return `${row.label}: ${value}`
      })
      .join('. ')
    return `${message.content}. ${flattened}.`
  }

  return message.content
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [activeFlow, setActiveFlow] = useState<ConversationFlow>('none')
  const [salesLead, setSalesLead] = useState<SalesLead>({})
  const [salesStep, setSalesStep] = useState<SalesStep>('idle')
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('idle')
  const [supportTicket, setSupportTicket] = useState<SupportTicket>({})
  const [supportStep, setSupportStep] = useState<SupportStep>('idle')
  const [isSendingLead, setIsSendingLead] = useState(false)
  const [introStep, setIntroStep] = useState<IntroStep>('askNeed')
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [pendingFlow, setPendingFlow] = useState<ConversationFlow | null>(null)
  const [voiceLocale, setVoiceLocale] = useState<VoiceLocale>('en-IN')
  const [lastUserLocale, setLastUserLocale] = useState<VoiceLocale>('en-IN')
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [autoVoiceResponses, setAutoVoiceResponses] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')

  const messageQueueRef = useRef<number[]>([])
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const previousMessageCountRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') {
        return
      }
      messageQueueRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      messageQueueRef.current = []
    }
  }, [])

  const addAssistantMessage = useCallback(
    (payload: Omit<Message, 'id' | 'sender' | 'timestamp'>) => {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          ...payload,
        },
      ])
    },
    [],
  )

  const clearQueuedMessages = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    messageQueueRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    messageQueueRef.current = []
  }, [])

  const scheduleAssistantMessages = useCallback(
    (
      batch: Array<Omit<Message, 'id' | 'sender' | 'timestamp'>>,
      delayBetweenMs = 650,
    ) => {
      if (batch.length === 0) {
        return
      }

      if (typeof window === 'undefined') {
        batch.forEach((payload) => addAssistantMessage(payload))
        return
      }

      batch.forEach((payload, index) => {
        const timeoutId = window.setTimeout(() => {
          addAssistantMessage(payload)
          messageQueueRef.current = messageQueueRef.current.filter(
            (pendingId) => pendingId !== timeoutId,
          )
        }, delayBetweenMs * index)

        messageQueueRef.current.push(timeoutId)
      })
    },
    [addAssistantMessage],
  )

  const startSalesLeadCapture = useCallback(() => {
    setActiveFlow('sales')
    setSalesLead({})
    setSalesStep('askPackage')
    addAssistantMessage({
      content:
        'Chaliye aapke liye sahi package shortlist karte hain. Kaunsa pack explore karna chahenge?',
      quickReplies: packages.map((offer) => ({
        label: offer.label,
        payload: offer.label,
      })),
    })
  }, [addAssistantMessage])

  const startOnboardingFlow = useCallback(() => {
    setActiveFlow('onboarding')
    setOnboardingData({})
    setOnboardingStep('askTrack')
    addAssistantMessage({
      content:
        'Kaun sa registration track follow karna chahoge? Main poora form fill karne me madad karungi.',
      quickReplies: registrationTracks.map((track) => ({
        label: track,
        payload: track,
      })),
    })
  }, [addAssistantMessage])

  const startSupportFlow = useCallback(() => {
    setActiveFlow('support')
    setSupportTicket({})
    setSupportStep('askTopic')
    addAssistantMessage({
      content: 'Customer care desk par swagat hai! Kis type ka concern resolve karna chahenge?',
      quickReplies: supportTopics.map((topic) => ({
        label: topic,
        payload: topic,
      })),
    })
  }, [addAssistantMessage])

  const startChosenFlow = useCallback(
    (flow: ConversationFlow) => {
      switch (flow) {
        case 'sales':
          startSalesLeadCapture()
          break
        case 'onboarding':
          startOnboardingFlow()
          break
        case 'support':
          startSupportFlow()
          break
        default:
          break
      }
    },
    [startOnboardingFlow, startSalesLeadCapture, startSupportFlow],
  )

  const sendPackagesOverview = useCallback(() => {
    scheduleAssistantMessages([
      {
        content: 'Yeh hamare sabse popular digital growth packs hain:',
        variant: 'packages',
        data: packages,
      },
    ])
  }, [scheduleAssistantMessages])

  const sendWidgetCard = useCallback(
    (selectedPackageId?: string) => {
      scheduleAssistantMessages([
        {
          content: 'Ek nazar me aapke options:',
          variant: 'widget',
          data: {
            ...widgetStaticData,
            selectedPackage: selectedPackageId,
          },
        },
      ])
    },
    [scheduleAssistantMessages],
  )

  const buildFlowChooserPayload = useCallback(
    (): Omit<Message, 'id' | 'sender' | 'timestamp'> => ({
      content: 'Batayiye, kya explore karna chahenge?',
      quickReplies: [
        {
          label: 'Lead capture shuru karo',
          payload: 'Lead capture shuru karo',
          skipFlowHandling: true,
          onSelect: startSalesLeadCapture,
          type: 'primary',
        },
        {
          label: 'Customer support & care',
          payload: 'Customer support',
          skipFlowHandling: true,
          onSelect: startSupportFlow,
        },
        {
          label: 'Onboarding / Registration madad',
          payload: 'Onboarding madad chahiye',
          skipFlowHandling: true,
          onSelect: startOnboardingFlow,
          type: 'secondary',
        },
        {
          label: 'Packs dubara dikhao',
          payload: 'Packages dikhao',
        },
      ],
    }),
    [startOnboardingFlow, startSalesLeadCapture, startSupportFlow],
  )

  const disableVoiceResponses = useCallback(() => {
    setAutoVoiceResponses((prev) => {
      if (prev && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      return false
    })
  }, [])

  const deriveSelectedPackageId = useCallback(() => {
    if (!salesLead.packageInterest) {
      return undefined
    }
    const interest = salesLead.packageInterest
    const matched =
      packages.find(
        (offer) =>
          normalise(offer.label) === normalise(interest) ||
          normalise(stripPrefixIcon(offer.label)) === normalise(interest),
      ) ??
      packages.find((offer) => normalise(offer.id) === normalise(interest))

    return matched?.id
  }, [salesLead.packageInterest])

  const runAudioDemo = useCallback(() => {
    if (!isSpeechSupported) {
      addAssistantMessage({
        content:
          'Audio demo sirf un browsers par available hai jahan speech synthesis support hoti hai (Chrome/Edge).',
      })
      return
    }

    setAutoVoiceResponses(true)

    const selectedPackage = deriveSelectedPackageId()
    const flowChooser = buildFlowChooserPayload()

    scheduleAssistantMessages(
      [
        {
          content:
            'Audio demo shuru kar rahi hoon. Main ab apne jawab bolkar bhi sunaoongi. Speaker icon se kabhi bhi mute kar sakte hain.',
        },
        {
          content: 'Yeh hamare sabse popular digital growth packs hain:',
          variant: 'packages',
          data: packages,
        },
        {
          content: 'Register Your Shop for ₹89, Go Digital, Get Udyam Free 🚀',
          variant: 'cta',
        },
        {
          content: 'Ek nazar me aapke options:',
          variant: 'widget',
          data: {
            ...widgetStaticData,
            selectedPackage,
          },
        },
        {
          content: 'Demo complete! Agla step choose karein:',
          quickReplies: [
            {
              label: 'Mute demo',
              onSelect: disableVoiceResponses,
            },
            ...(flowChooser.quickReplies ?? []),
          ],
        },
      ],
      750,
    )
  }, [
    addAssistantMessage,
    buildFlowChooserPayload,
    deriveSelectedPackageId,
    disableVoiceResponses,
    isSpeechSupported,
    scheduleAssistantMessages,
  ])

  const sendFlowChooser = useCallback(() => {
    const payload = buildFlowChooserPayload()
    const quickReplies = [
      ...(payload.quickReplies ?? []),
      {
        label: 'Audio demo chalao',
        payload: 'Audio demo chalao',
        skipFlowHandling: true,
        onSelect: runAudioDemo,
      },
    ]

    scheduleAssistantMessages([
      {
        ...payload,
        quickReplies,
      },
    ])
  }, [buildFlowChooserPayload, runAudioDemo, scheduleAssistantMessages])

  const presentMenuForUser = useCallback(
    (profileOverride?: UserProfile) => {
      const profile = profileOverride ?? userProfile
      const namePart = profile.name ? ` ${profile.name}` : ''
      const confirmationMessage = profile.phone
        ? `Shukriya${namePart}! Aapke contact (${profile.phone}) note kar liye hain. Ab main packages, onboarding aur customer support options share karti hoon.`
        : `Shukriya${namePart}! Ab main packages, onboarding aur customer support options share karti hoon.`

      const selected = deriveSelectedPackageId()
      const flowChooserPayload = buildFlowChooserPayload()
      const quickReplies = [
        ...(flowChooserPayload.quickReplies ?? []),
        {
          label: 'Audio demo chalao',
          payload: 'Audio demo chalao',
          skipFlowHandling: true,
          onSelect: runAudioDemo,
        },
      ]

      scheduleAssistantMessages(
        [
          { content: confirmationMessage },
          {
            content: 'Yeh hamare sabse popular digital growth packs hain:',
            variant: 'packages',
            data: packages,
          },
          {
            content: 'Register Your Shop for ₹89, Go Digital, Get Udyam Free 🚀',
            variant: 'cta',
          },
          {
            content: 'Ek nazar me aapke options:',
            variant: 'widget',
            data: {
              ...widgetStaticData,
              selectedPackage: selected,
            },
          },
          {
            content:
              'Customer care update: 24x7 ticket inbox, WhatsApp escalation lane aur human specialists ready hain. Kisi bhi issue par "Customer support" select karein.',
          },
          {
            ...flowChooserPayload,
            quickReplies,
          },
        ],
        700,
      )
    },
    [
      buildFlowChooserPayload,
      deriveSelectedPackageId,
      runAudioDemo,
      scheduleAssistantMessages,
      userProfile,
    ],
  )

  const sendWelcome = useCallback(() => {
    setIntroStep('askNeed')
    setUserProfile({})
    setPendingFlow(null)
    scheduleAssistantMessages(
      [
        {
          content:
            'Namaste 🙏 Sudarshan AI Labs me aapka swagat hai! Main Leeila AI hoon — aapki Customer Care + Sales Head sahayak.',
        },
        {
          content:
            'Batayiye kis cheez me madad chahiye? Sales consultation, customer support ya onboarding?',
          quickReplies: [
            { label: 'Sales consultation', payload: 'Sales consultation' },
            { label: 'Customer support', payload: 'Customer support' },
            { label: 'Onboarding help', payload: 'Onboarding help' },
            { label: 'Audio demo', payload: 'Audio demo chalao' },
          ],
        },
        {
          content:
            'Voice demo dekhne ke liye "Audio demo chalao" type karein ya niche speaker icon se enable karein.',
        },
      ],
      700,
    )
  }, [scheduleAssistantMessages])

  useEffect(() => {
    if (messages.length === 0) {
      sendWelcome()
    }
  }, [messages.length, sendWelcome])

  const resetAssistant = useCallback(() => {
    clearQueuedMessages()
    setMessages([])
    setActiveFlow('none')
    setSalesLead({})
    setSalesStep('idle')
    setOnboardingData({})
    setOnboardingStep('idle')
    setSupportTicket({})
    setSupportStep('idle')
    setPendingFlow(null)
    setIntroStep('askNeed')
    setUserProfile({})
    setIsSendingLead(false)
    setVoiceTranscript('')
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        sendWelcome()
      }, 40)
    }
  }, [clearQueuedMessages, sendWelcome])

  const sendLeadToWebhook = useCallback(async (payload: Record<string, unknown>) => {
    const webhookUrl = import.meta.env.VITE_LEAD_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('VITE_LEAD_WEBHOOK_URL not configured')
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`)
    }
  }, [])

  const submitSalesLead = useCallback(async () => {
    if (isSendingLead) {
      return
    }
    if (
      !salesLead.packageInterest ||
      !salesLead.name ||
      !salesLead.phone ||
      !salesLead.city
    ) {
      addAssistantMessage({
        content:
          'Lagta hai kuch details missing hain. Kripya sabhi fields fill karke confirm kijiye.',
      })
      return
    }

    setIsSendingLead(true)
    try {
      await sendLeadToWebhook({
        source: 'Leeila Sales Assistant',
        flow: 'sales',
        capturedAt: new Date().toISOString(),
        ...salesLead,
      })
      addAssistantMessage({
        content:
          'Shukriya! Maine detail Sudarshan AI Labs team ko forward kar di hai. Jaldi hi aapko revert aayega.',
      })
      setSalesLead({})
      setSalesStep('idle')
      setActiveFlow('none')
      sendFlowChooser()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown webhook error'
      addAssistantMessage({
        content: `Webhook se connect nahi ho paaya. Baad me try karein ya manually detail bhejein. (${message})`,
      })
    } finally {
      setIsSendingLead(false)
    }
  }, [
    addAssistantMessage,
    isSendingLead,
    salesLead,
    sendFlowChooser,
    sendLeadToWebhook,
  ])

  const showSalesSummary = useCallback(
    (lead: SalesLead) => {
      const summary = [
        { label: 'Interested Pack', value: lead.packageInterest ?? '—' },
        { label: 'Name', value: lead.name ?? '—' },
        { label: 'Phone', value: lead.phone ?? '—' },
        { label: 'Business Type', value: lead.businessType ?? '—' },
        { label: 'City', value: lead.city ?? '—' },
      ]

      addAssistantMessage({
        content:
          'Maine sab details note kar liye hain. Kya main lead ko team ke paas bhej du?',
        variant: 'summary',
        data: summary,
        quickReplies: [
          {
            label: 'Confirm & Notify Team',
            payload: 'Lead confirm karo',
            skipFlowHandling: true,
            onSelect: submitSalesLead,
            type: 'primary',
          },
          {
            label: 'Details update karni hain',
            payload: 'Details update karni hain',
          },
          {
            label: 'Reset chat',
            payload: 'Chat reset karo',
            skipFlowHandling: true,
            onSelect: resetAssistant,
          },
        ],
      })
    },
    [addAssistantMessage, resetAssistant, submitSalesLead],
  )

  const submitOnboardingLead = useCallback(async () => {
    if (isSendingLead) {
      return
    }
    if (
      !onboardingData.track ||
      !onboardingData.ownerName ||
      !onboardingData.businessName ||
      !onboardingData.phone ||
      !onboardingData.city ||
      !onboardingData.state
    ) {
      addAssistantMessage({
        content:
          'Form complete nahi hua. Kripya missing fields fill karke confirm kijiye.',
      })
      return
    }

    setIsSendingLead(true)
    try {
      await sendLeadToWebhook({
        source: 'Leeila Onboarding Agent',
        flow: 'onboarding',
        capturedAt: new Date().toISOString(),
        ...onboardingData,
      })
      addAssistantMessage({
        content:
          'Great! Registration request team ko forward ho gayi hai. Hum jaldi aapko process update karenge.',
      })
      setOnboardingData({})
      setOnboardingStep('idle')
      setActiveFlow('none')
      sendFlowChooser()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown webhook error'
      addAssistantMessage({
        content: `Webhook error: ${message}. Aap details email/WhatsApp se bhi bhej sakte hain.`,
      })
    } finally {
      setIsSendingLead(false)
    }
  }, [
    addAssistantMessage,
    isSendingLead,
    onboardingData,
    sendFlowChooser,
    sendLeadToWebhook,
  ])

  const submitSupportTicket = useCallback(async () => {
    if (isSendingLead) {
      return
    }

    if (
      !supportTicket.topic ||
      !supportTicket.issueDescription ||
      !supportTicket.preferredChannel
    ) {
      addAssistantMessage({
        content: 'Ticket bhejne se pehle topic, issue aur preferred contact channel batana zaruri hai.',
      })
      return
    }

    setIsSendingLead(true)
    try {
      await sendLeadToWebhook({
        source: 'Leeila Customer Care',
        flow: 'support',
        capturedAt: new Date().toISOString(),
        ...supportTicket,
        customerName: userProfile.name,
        customerPhone: userProfile.phone,
      })
      addAssistantMessage({
        content:
          'Ho gaya! Maine support squad ko alert kar diya hai. Aapke prefer kiye gaye channel par jaldi follow-up aayega.',
      })
      setSupportTicket({})
      setSupportStep('idle')
      setActiveFlow('none')
      sendFlowChooser()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown webhook error'
      addAssistantMessage({
        content: `Ticket bhejte waqt dikkat aayi (${message}). Main human specialist ko notify karne ki koshish karungi.`,
      })
    } finally {
      setIsSendingLead(false)
    }
  }, [
    addAssistantMessage,
    isSendingLead,
    sendFlowChooser,
    sendLeadToWebhook,
    supportTicket,
    userProfile.name,
    userProfile.phone,
  ])

  const showOnboardingSummary = useCallback(
    (data: OnboardingData) => {
      const summary = [
        { label: 'Track', value: data.track ?? '-' },
        { label: 'Owner', value: data.ownerName ?? '-' },
        { label: 'Business', value: data.businessName ?? '—' },
        { label: 'Phone', value: data.phone ?? '—' },
        {
          label: 'Location',
          value: [data.city, data.state].filter(Boolean).join(', ') || '—',
        },
        { label: 'Business Type', value: data.businessType ?? '—' },
        { label: 'Years in Business', value: data.yearsInBusiness ?? '—' },
        { label: 'Existing Registration', value: data.existingRegistration ?? '—' },
        { label: 'Revenue Band', value: data.revenueBand ?? '—' },
      ]

      addAssistantMessage({
        content: 'Registration details ready hain. Submit karu?',
        variant: 'summary',
        data: summary,
        quickReplies: [
          {
            label: 'Submit for onboarding',
            payload: 'Onboarding submit karo',
            skipFlowHandling: true,
            onSelect: submitOnboardingLead,
            type: 'primary',
          },
          {
            label: 'Kuch edit karna hai',
            payload: 'Onboarding edit karna hai',
          },
          {
            label: 'Reset chat',
            payload: 'Chat reset karo',
            skipFlowHandling: true,
            onSelect: resetAssistant,
          },
        ],
      })
    },
    [addAssistantMessage, resetAssistant, submitOnboardingLead],
  )

  const showSupportSummary = useCallback(
    (ticket: SupportTicket) => {
      const summary = [
        { label: 'Topic', value: ticket.topic ?? '—' },
        { label: 'Description', value: ticket.issueDescription ?? '—' },
        { label: 'Urgency', value: ticket.urgency ?? '—' },
        { label: 'Preferred channel', value: ticket.preferredChannel ?? '—' },
      ]

      addAssistantMessage({
        content: 'Support request ready hai. Kya main team ko forward kar du?',
        variant: 'summary',
        data: summary,
        quickReplies: [
          {
            label: 'Confirm & create ticket',
            payload: 'Support ticket submit karo',
            skipFlowHandling: true,
            onSelect: submitSupportTicket,
            type: 'primary',
          },
          {
            label: 'Details edit karni hain',
            payload: 'Support edit karna hai',
          },
          {
            label: 'Human se baat karni hai',
            payload: 'Human support please',
          },
        ],
      })
    },
    [addAssistantMessage, submitSupportTicket],
  )

  const handleIntroInput = useCallback(
    (rawText: string) => {
      const text = rawText.trim()
      if (!text) {
        return
      }

      if (/reset|restart|naya/i.test(text)) {
        resetAssistant()
        return
      }

      if (introStep === 'askNeed') {
        const lowered = text.toLowerCase()

        if (/(audio|voice)\s*demo/.test(lowered) || /demo/.test(lowered)) {
          runAudioDemo()
          addAssistantMessage({
            content:
              'Demo chalu kar diya hai. Ab batayein kis cheez me madad chahiye — sales, customer support ya onboarding?',
            quickReplies: [
              { label: 'Sales consultation', payload: 'Sales consultation' },
              { label: 'Customer support', payload: 'Customer support' },
              { label: 'Onboarding help', payload: 'Onboarding help' },
            ],
          })
          return
        }

        let desiredFlow: ConversationFlow | null = null
        if (
          lowered.includes('support') ||
          lowered.includes('issue') ||
          lowered.includes('problem') ||
          lowered.includes('care')
        ) {
          desiredFlow = 'support'
        } else if (
          lowered.includes('onboard') ||
          lowered.includes('register') ||
          lowered.includes('udyam') ||
          lowered.includes('gst')
        ) {
          desiredFlow = 'onboarding'
        } else if (
          lowered.includes('sales') ||
          lowered.includes('package') ||
          lowered.includes('pricing') ||
          lowered.includes('price') ||
          lowered.includes('growth')
        ) {
          desiredFlow = 'sales'
        }

        if (!desiredFlow) {
          addAssistantMessage({
            content:
              'Main sales consultation, onboarding aur customer support me madad karti hoon. Neeche se ek option choose karein.',
            quickReplies: [
              { label: 'Sales consultation', payload: 'Sales consultation' },
              { label: 'Customer support', payload: 'Customer support' },
              { label: 'Onboarding help', payload: 'Onboarding help' },
              { label: 'Audio demo', payload: 'Audio demo chalao' },
            ],
          })
          return
        }

        setPendingFlow(desiredFlow)
        const acknowledgement = getFlowAcknowledgement(desiredFlow, userProfile)

        if (!userProfile.name) {
          setIntroStep('askName')
          scheduleAssistantMessages(
            [
              { content: acknowledgement },
              { content: 'Sabse pehle aapka naam batayein?' },
            ],
            600,
          )
          return
        }

        if (!userProfile.phone) {
          setIntroStep('askPhone')
          scheduleAssistantMessages(
            [
              { content: acknowledgement },
              { content: 'Apna contact number (10 digit) share kijiye.' },
            ],
            600,
          )
          return
        }

        setIntroStep('completed')
        setPendingFlow(null)
        addAssistantMessage({
          content: `${acknowledgement} Shukriya!`,
        })
        startChosenFlow(desiredFlow)
        return
      }

      if (introStep === 'askName') {
        const formattedName = formatTitleCase(text)
        const profile: UserProfile = {
          ...userProfile,
          name: formattedName,
        }
        setUserProfile(profile)
        setIntroStep('askPhone')
        scheduleAssistantMessages(
          [
            {
              content: `Bahut badhiya, ${formattedName}!`,
            },
            {
              content: 'Apna contact number (10 digit) share kijiye.',
            },
          ],
          650,
        )
        return
      }

      if (introStep === 'askPhone') {
        const phoneDigits = extractValidPhoneDigits(text)
        if (!phoneDigits) {
          scheduleAssistantMessages([
            {
              content:
                'Contact number sirf 10 digits ka hona chahiye. Kripya sirf numbers me dobara bhejein.',
            },
          ])
          return
        }

        const updatedProfile: UserProfile = {
          ...userProfile,
          phone: phoneDigits,
        }
        setUserProfile(updatedProfile)
        setIntroStep('completed')
        if (pendingFlow) {
          const flowToLaunch = pendingFlow
          setPendingFlow(null)
          const acknowledgement = `${getFlowAcknowledgement(
            flowToLaunch,
            updatedProfile,
          )} Shukriya! Contact (${phoneDigits}) note kar liya hai.`
          addAssistantMessage({
            content: acknowledgement,
          })
          startChosenFlow(flowToLaunch)
        } else {
          presentMenuForUser(updatedProfile)
        }
      }
    },
    [
      addAssistantMessage,
      introStep,
      pendingFlow,
      presentMenuForUser,
      resetAssistant,
      scheduleAssistantMessages,
      startChosenFlow,
      runAudioDemo,
      userProfile,
    ],
  )
  const handleWidgetPackagePick = useCallback(
    (packageId: string) => {
      if (!packageId) {
        setSalesLead((prev) => ({
          ...prev,
          packageInterest: undefined,
        }))
        return
      }
      const selected = packages.find((offer) => offer.id === packageId)
      const label = selected?.label ?? formatTitleCase(packageId.replace(/[-_]/g, ' '))
      setSalesLead((prev) => ({
        ...prev,
        packageInterest: label,
      }))
      setActiveFlow('sales')
      setSalesStep('askName')
      addAssistantMessage({
        content: selected
          ? `${selected.label} select kiya. Ab aapka naam batayein?`
          : 'Pack select ho gaya. Ab aapka naam batayein?',
      })
    },
    [addAssistantMessage],
  )

  const handleWidgetLeadSubmit = useCallback(
    (payload: Record<string, string>) => {
      const chosenPackageId = payload['lead.package'] || deriveSelectedPackageId()
      const phoneDigits = extractValidPhoneDigits(payload['lead.phone'] ?? '')
      if (!phoneDigits) {
        addAssistantMessage({
          content:
            'Contact number sirf 10 digits ka hona chahiye. Kripya sirf numbers mein dobara bhejein.',
        })
        return
      }
      const selectedOffer = chosenPackageId
        ? packages.find((offer) => offer.id === chosenPackageId)
        : undefined
      const packageInterest =
        selectedOffer?.label ??
        salesLead.packageInterest ??
        (payload['lead.package'] ? formatTitleCase(payload['lead.package']) : packages[0].label)

      const lead: SalesLead = {
        packageInterest,
        name: formatTitleCase(payload['lead.name'] ?? ''),
        phone: phoneDigits,
        businessType: formatTitleCase(payload['lead.businessType'] ?? ''),
        city: formatTitleCase(payload['lead.city'] ?? ''),
      }

      setSalesLead(lead)
      setActiveFlow('sales')
      setSalesStep('review')
      addAssistantMessage({
        content: 'Shukriya! Form ke details maine capture kar liye hain.',
      })
      showSalesSummary(lead)
    },
    [
      addAssistantMessage,
      deriveSelectedPackageId,
      salesLead.packageInterest,
      showSalesSummary,
    ],
  )

  const handleWidgetLeadReset = useCallback(() => {
    setSalesLead((prev) => ({
      packageInterest: prev.packageInterest,
    }))
    setSalesStep('askName')
    addAssistantMessage({
      content: 'Form clear kar diya hai. Jab ready ho, nayi details bhej dijiye.',
    })
  }, [addAssistantMessage])

  const handleSalesInput = useCallback(
    (rawText: string) => {
      const text = rawText.trim()
      if (!text) {
        return
      }

      if (/reset|restart|naya/i.test(text)) {
        resetAssistant()
        return
      }

      if (/pack|price|plan/i.test(text) && salesStep !== 'askPackage') {
        sendPackagesOverview()
      }

      switch (salesStep) {
        case 'askPackage': {
          const selected =
            packages.find(
              (offer) =>
                normalise(offer.label) === normalise(text) ||
                normalise(offer.label).includes(normalise(text)) ||
                normalise(text).includes(normalise(offer.label)),
            ) ?? packages.find((offer) => normalise(offer.id) === normalise(text))

          const updatedLead: SalesLead = {
            ...salesLead,
            packageInterest: selected ? selected.label : formatTitleCase(text),
          }
          setSalesLead(updatedLead)
          setSalesStep('askName')

          if (selected) {
            addAssistantMessage({
              content: `${selected.label} mein ${selected.description} include hai. Ab aapka naam batayein?`,
            })
          } else {
            addAssistantMessage({
              content:
                'Noted! Aapka naam batayein taaki hum baaki detail fill kar saken.',
            })
          }
          break
        }
        case 'askName': {
          const updatedLead: SalesLead = {
            ...salesLead,
            name: formatTitleCase(text),
          }
          setSalesLead(updatedLead)
          setSalesStep('askPhone')
          addAssistantMessage({
            content: 'Shukriya! Contact number (10 digit) share kijiye.',
          })
          break
        }
        case 'askPhone': {
          const phoneDigits = extractValidPhoneDigits(text)
          if (!phoneDigits) {
            addAssistantMessage({
              content:
                'Contact number sirf 10 digits ka hona chahiye. Kripya dobara try karein.',
            })
            return
          }
          const updatedLead: SalesLead = {
            ...salesLead,
            phone: phoneDigits,
          }
          setSalesLead(updatedLead)
          setSalesStep('askBusinessType')
          addAssistantMessage({
            content: 'Aapka business kis type ka hai?',
            quickReplies: businessTypeOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askBusinessType': {
          const updatedLead: SalesLead = {
            ...salesLead,
            businessType: formatTitleCase(text),
          }
          setSalesLead(updatedLead)
          setSalesStep('askCity')
          addAssistantMessage({
            content: 'Kaun se sheher se operate karte hain?',
          })
          break
        }
        case 'askCity': {
          const updatedLead: SalesLead = {
            ...salesLead,
            city: formatTitleCase(text),
          }
          setSalesLead(updatedLead)
          setSalesStep('review')
          showSalesSummary(updatedLead)
          break
        }
        case 'review': {
          if (/confirm|notify|done|submit/i.test(text)) {
            submitSalesLead()
          } else if (/update|edit|change/i.test(text)) {
            setSalesStep('askName')
            addAssistantMessage({
              content: 'Theek hai, naam se dobara start karte hain. Apna naam batayein.',
            })
          } else {
            addAssistantMessage({
              content:
                'Agar sab theek hai to "Confirm" bol dijiye, ya bataiye kis field ko update karna hai.',
            })
          }
          break
        }
        default:
          startSalesLeadCapture()
      }
    },
    [
      addAssistantMessage,
      resetAssistant,
      salesLead,
      salesStep,
      sendPackagesOverview,
      showSalesSummary,
      startSalesLeadCapture,
      submitSalesLead,
    ],
  )

  const handleOnboardingInput = useCallback(
    (rawText: string) => {
      const text = rawText.trim()
      if (!text) {
        return
      }

      if (/reset|restart|naya/i.test(text)) {
        resetAssistant()
        return
      }

      switch (onboardingStep) {
        case 'askTrack': {
          const selected = registrationTracks.find(
            (track) =>
              normalise(track) === normalise(text) ||
              normalise(track).includes(normalise(text)),
          )
          const updated: OnboardingData = {
            ...onboardingData,
            track: selected ?? formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askOwnerName')
          addAssistantMessage({
            content: 'Business owner ka poora naam batayein.',
          })
          break
        }
        case 'askOwnerName': {
          const updated: OnboardingData = {
            ...onboardingData,
            ownerName: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askStoreName')
          addAssistantMessage({
            content: 'Store ya brand ka naam kya hai?',
          })
          break
        }
        case 'askStoreName': {
          const updated: OnboardingData = {
            ...onboardingData,
            businessName: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askContact')
          addAssistantMessage({
            content: 'Contact number (10 digit) share kijiye.',
          })
          break
        }
        case 'askContact': {
          const phoneDigits = extractValidPhoneDigits(text)
          if (!phoneDigits) {
            addAssistantMessage({
              content: 'Valid 10 digit mobile number share kijiye (sirf 10 digits).',
            })
            return
          }
          const updated: OnboardingData = { ...onboardingData, phone: phoneDigits }
          setOnboardingData(updated)
          setOnboardingStep('askLocationCity')
          addAssistantMessage({
            content: 'Business kis sheher me hai?',
          })
          break
        }
        case 'askLocationCity': {
          const updated: OnboardingData = {
            ...onboardingData,
            city: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askLocationState')
          addAssistantMessage({
            content: 'State ya Pradesh ka naam batayein.',
          })
          break
        }
        case 'askLocationState': {
          const updated: OnboardingData = {
            ...onboardingData,
            state: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askBusinessType')
          addAssistantMessage({
            content: 'Business kis category me aata hai?',
            quickReplies: businessTypeOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askBusinessType': {
          const updated: OnboardingData = {
            ...onboardingData,
            businessType: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askYears')
          addAssistantMessage({
            content: 'Business kitne time se chal raha hai?',
            quickReplies: yearOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askYears': {
          const updated: OnboardingData = {
            ...onboardingData,
            yearsInBusiness: text,
          }
          setOnboardingData(updated)
          setOnboardingStep('askExistingReg')
          addAssistantMessage({
            content: 'Kya aapke paas pehle se koi registration hai?',
            quickReplies: [
              'Udyam/MSME',
              'GST',
              'Dono',
              'Nahi hai',
            ].map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askExistingReg': {
          const updated: OnboardingData = {
            ...onboardingData,
            existingRegistration: formatTitleCase(text),
          }
          setOnboardingData(updated)
          setOnboardingStep('askRevenueBand')
          addAssistantMessage({
            content: 'Annual revenue bracket select kijiye.',
            quickReplies: revenueBandOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askRevenueBand': {
          const updated: OnboardingData = {
            ...onboardingData,
            revenueBand: text,
          }
          setOnboardingData(updated)
          setOnboardingStep('review')
          showOnboardingSummary(updated)
          break
        }
        case 'review': {
          if (/submit|confirm|done/i.test(text)) {
            submitOnboardingLead()
          } else if (/edit|change|update/i.test(text)) {
            setOnboardingStep('askOwnerName')
            addAssistantMessage({
              content: 'Theek hai, owner ka naam dobara batayein.',
            })
          } else {
            addAssistantMessage({
              content:
                'Please confirm karein ya batayein kya change karna hai.',
            })
          }
          break
        }
        default:
          startOnboardingFlow()
      }
    },
    [
      addAssistantMessage,
      onboardingData,
      onboardingStep,
      resetAssistant,
      showOnboardingSummary,
      startOnboardingFlow,
      submitOnboardingLead,
    ],
  )

  const handleSupportInput = useCallback(
    (rawText: string) => {
      const text = rawText.trim()
      if (!text) {
        return
      }

      if (/reset|restart|naya/i.test(text)) {
        resetAssistant()
        return
      }

      switch (supportStep) {
        case 'askTopic': {
          const matched =
            supportTopics.find(
              (topic) =>
                normalise(topic) === normalise(text) ||
                normalise(topic).includes(normalise(text)),
            ) ?? formatTitleCase(text)
          const updated: SupportTicket = {
            ...supportTicket,
            topic: matched,
          }
          setSupportTicket(updated)
          setSupportStep('askIssue')

          const faq = matchSupportFaq(matched)
          if (faq) {
            scheduleAssistantMessages(
              [
                {
                  content: faq.answer,
                },
                {
                  content:
                    faq.followUp ??
                    'Please concern ka short description share kijiye taaki main ticket raise kar saku.',
                },
              ],
              650,
            )
          } else {
            addAssistantMessage({
              content:
                'Please concern ka short description share kijiye taaki main ticket raise kar saku.',
            })
          }
          break
        }
        case 'askIssue': {
          const updated: SupportTicket = {
            ...supportTicket,
            issueDescription: text,
          }
          setSupportTicket(updated)
          setSupportStep('askUrgency')
          addAssistantMessage({
            content: 'Issue ki urgency batayein?',
            quickReplies: supportUrgencyOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askUrgency': {
          const updated: SupportTicket = {
            ...supportTicket,
            urgency: formatTitleCase(text),
          }
          setSupportTicket(updated)
          setSupportStep('askChannel')
          addAssistantMessage({
            content: 'Team aapse kaise connect kare?',
            quickReplies: supportChannelOptions.map((option) => ({
              label: option,
              payload: option,
            })),
          })
          break
        }
        case 'askChannel': {
          const updated: SupportTicket = {
            ...supportTicket,
            preferredChannel: formatTitleCase(text),
          }
          setSupportTicket(updated)
          setSupportStep('review')
          showSupportSummary(updated)
          break
        }
        case 'review': {
          if (/sirf call/i.test(text)) {
            addAssistantMessage({
              content:
                'Noted! Maine escalation mark kar di hai. Human representative aapko preferred channel par ping karega.',
            })
            setSupportStep('idle')
            setActiveFlow('none')
            sendFlowChooser()
          } else if (/submit|confirm|done|haan ticket/i.test(text)) {
            submitSupportTicket()
          } else if (/edit|change|update/i.test(text)) {
            setSupportStep('askIssue')
            addAssistantMessage({
              content: 'Theek hai, issue ka detail dobara share kijiye.',
            })
          } else if (/human|agent|specialist/i.test(text)) {
            addAssistantMessage({
              content:
                'Main human specialist ko ping kar rahi hoon. Aapko jaldi hi call back aayega. Tab tak kya main ticket bhi raise kar du?',
              quickReplies: [
                {
                  label: 'Haan, ticket bhej do',
                  payload: 'Haan ticket bhejo',
                },
                {
                  label: 'Sirf call chahiye',
                  payload: 'Sirf call chahiye',
                },
              ],
            })
          } else {
            addAssistantMessage({
              content: 'Please confirm karein ya batayein kya update karna hai.',
            })
          }
          break
        }
        default:
          startSupportFlow()
      }
    },
    [
      addAssistantMessage,
      resetAssistant,
      scheduleAssistantMessages,
      sendFlowChooser,
      showSupportSummary,
      startSupportFlow,
      submitSupportTicket,
      supportStep,
      supportTicket,
    ],
  )

  const processUserInput = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return
      }

      const locale = detectLocale(text)
      setLastUserLocale(locale)
      if (!isListening) {
        setVoiceLocale(locale)
      }

      if (/reset|restart|naya/i.test(text)) {
        resetAssistant()
        return
      }

      if (introStep !== 'completed') {
        handleIntroInput(text)
        return
      }

      if (activeFlow === 'sales') {
        handleSalesInput(text)
        return
      }

      if (activeFlow === 'onboarding') {
        handleOnboardingInput(text)
        return
      }

      if (activeFlow === 'support') {
        handleSupportInput(text)
        return
      }

      const lowered = text.toLowerCase()

      if (lowered.includes('onboard') || lowered.includes('register')) {
        startOnboardingFlow()
        return
      }

      if (lowered.includes('lead') || lowered.includes('contact')) {
        startSalesLeadCapture()
        return
      }

      if (
        lowered.includes('support') ||
        lowered.includes('help') ||
        lowered.includes('issue') ||
        lowered.includes('care')
      ) {
        startSupportFlow()
        return
      }

      if (/\bdemo\b/.test(lowered)) {
        runAudioDemo()
        return
      }

      if (lowered.includes('pack') || lowered.includes('price')) {
        const selected = deriveSelectedPackageId()
        sendPackagesOverview()
        sendWidgetCard(selected)
        sendFlowChooser()
        return
      }

      const matchedFaq = matchSupportFaq(lowered)
      if (matchedFaq) {
        addAssistantMessage({
          content: matchedFaq.answer,
          quickReplies: [
            {
              label: 'Customer care ticket',
              payload: 'Support ticket raise karo',
              skipFlowHandling: true,
              onSelect: startSupportFlow,
              type: 'primary',
            },
            {
              label: 'Packages dikhao',
              payload: 'Packages dikhao',
            },
          ],
        })
        if (matchedFaq.followUp) {
          scheduleAssistantMessages(
            [
              {
                content: matchedFaq.followUp,
              },
            ],
            600,
          )
        }
        return
      }

      addAssistantMessage({
        content:
          'Main customer care, sales aur onboarding sab cover karti hoon. Bataiye lead capture, support ticket ya onboarding me se kya shuru karein?',
        quickReplies: [
          {
            label: 'Sales / Packages',
            payload: 'Lead capture shuru karo',
            skipFlowHandling: true,
            onSelect: startSalesLeadCapture,
            type: 'primary',
          },
          {
            label: 'Customer support',
            payload: 'Support chahiye',
            skipFlowHandling: true,
            onSelect: startSupportFlow,
          },
          {
            label: 'Onboarding help',
            payload: 'Onboarding help',
            skipFlowHandling: true,
            onSelect: startOnboardingFlow,
          },
          {
            label: 'Audio demo',
            payload: 'Audio demo chalao',
            skipFlowHandling: true,
            onSelect: runAudioDemo,
          },
        ],
      })
    },
    [
      activeFlow,
      addAssistantMessage,
      deriveSelectedPackageId,
      handleIntroInput,
      handleOnboardingInput,
      handleSalesInput,
      handleSupportInput,
      introStep,
      isListening,
      matchSupportFaq,
      resetAssistant,
      runAudioDemo,
      scheduleAssistantMessages,
      sendFlowChooser,
      sendPackagesOverview,
      sendWidgetCard,
      startOnboardingFlow,
      startSalesLeadCapture,
      startSupportFlow,
    ],
  )

  const sendUserMessage = useCallback(
    (text: string, options?: { skipFlowHandling?: boolean }) => {
      const trimmed = text.trim()
      if (!trimmed) {
        return
      }
      const locale = detectLocale(trimmed)
      setLastUserLocale(locale)
      if (!isListening) {
        setVoiceLocale(locale)
      }
      const message: Message = {
        id: makeId(),
        sender: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, message])

      if (!options?.skipFlowHandling) {
        processUserInput(trimmed)
      }
    },
    [isListening, processUserInput],
  )

  const submitVoiceTranscript = useCallback(
    (transcript: string) => {
      const clean = transcript.trim()
      if (!clean) {
        return
      }
      sendUserMessage(clean)
    },
    [sendUserMessage],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const SpeechRecognitionConstructor:
      | (new () => SpeechRecognitionLike)
      | null =
      (window as typeof window & {
        SpeechRecognition?: new () => SpeechRecognitionLike
        webkitSpeechRecognition?: new () => SpeechRecognitionLike
      }).SpeechRecognition ??
      (window as typeof window & {
        webkitSpeechRecognition?: new () => SpeechRecognitionLike
      }).webkitSpeechRecognition ??
      null

    if (!SpeechRecognitionConstructor) {
      setIsVoiceSupported(false)
      return
    }

    setIsVoiceSupported(true)

    let recognition = recognitionRef.current
    if (!recognition) {
      recognition = new SpeechRecognitionConstructor()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceTranscript('')
      }

      recognition.onerror = () => {
        setIsListening(false)
        setVoiceTranscript('')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const latest = event.results[event.results.length - 1]
        if (!latest) {
          return
        }
        const transcript = (latest[0]?.transcript ?? '').trim()
        if (!transcript) {
          return
        }
        if (!latest.isFinal) {
          setVoiceTranscript(transcript)
          return
        }

        setVoiceTranscript('')
        submitVoiceTranscript(transcript)
      }

      recognitionRef.current = recognition
    }

    recognition.lang = voiceLocale

    return () => {
      recognition?.stop()
    }
  }, [submitVoiceTranscript, voiceLocale])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!('speechSynthesis' in window)) {
      setIsSpeechSupported(false)
      return
    }

    setIsSpeechSupported(true)

    const populateVoices = () => {
      speechVoicesRef.current = window.speechSynthesis.getVoices()
    }

    populateVoices()

    window.speechSynthesis.onvoiceschanged = populateVoices

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const startVoiceCapture = useCallback(() => {
    if (!isVoiceSupported || typeof window === 'undefined') {
      return
    }
    const recognition = recognitionRef.current
    if (!recognition || isListening) {
      return
    }
    setVoiceTranscript('')
    try {
      recognition.lang = voiceLocale
      recognition.start()
    } catch {
      // ignored: calling start while already capturing throws
    }
  }, [isListening, isVoiceSupported, voiceLocale])

  const stopVoiceCapture = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) {
      return
    }
    recognition.stop()
  }, [])

  const toggleVoiceCapture = useCallback(() => {
    if (!isVoiceSupported) {
      return
    }
    if (isListening) {
      stopVoiceCapture()
    } else {
      startVoiceCapture()
    }
  }, [isListening, isVoiceSupported, startVoiceCapture, stopVoiceCapture])

  const toggleVoiceResponses = useCallback(() => {
    setAutoVoiceResponses((prev) => {
      if (prev && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      return !prev
    })
  }, [])

  const speakAssistantMessage = useCallback(
    (message: Message) => {
      if (
        !autoVoiceResponses ||
        !isSpeechSupported ||
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
      ) {
        return
      }

      if (isListening) {
        return
      }

      const text = summariseMessageForSpeech(message).trim()
      if (!text) {
        return
      }

      const preferredLocale = detectLocale(text) === 'hi-IN' ? 'hi-IN' : lastUserLocale
      const voices = speechVoicesRef.current
      const matchingVoice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith(preferredLocale.toLowerCase())) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith(preferredLocale.slice(0, 2))) ??
        voices[0]

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = matchingVoice?.lang ?? preferredLocale
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }
      utterance.rate = preferredLocale === 'hi-IN' ? 0.96 : 1.02
      speechUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [autoVoiceResponses, isListening, isSpeechSupported, lastUserLocale],
  )

  useEffect(() => {
    if (!autoVoiceResponses || !isSpeechSupported) {
      previousMessageCountRef.current = messages.length
      return
    }

    if (messages.length === 0) {
      previousMessageCountRef.current = 0
      return
    }

    if (messages.length <= previousMessageCountRef.current) {
      previousMessageCountRef.current = messages.length
      return
    }

    previousMessageCountRef.current = messages.length
    const latest = messages[messages.length - 1]
    if (latest?.sender !== 'assistant') {
      return
    }

    speakAssistantMessage(latest)
  }, [autoVoiceResponses, isSpeechSupported, messages, speakAssistantMessage])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inputValue.trim()) {
      return
    }

    const value = inputValue
    setInputValue('')
    sendUserMessage(value)
  }

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.payload) {
      sendUserMessage(reply.payload, {
        skipFlowHandling: reply.skipFlowHandling,
      })
    }
    if (reply.onSelect) {
      reply.onSelect()
    }
  }

  const renderMessageContent = (message: Message) => {
    if (message.variant === 'packages' && Array.isArray(message.data)) {
      const offers = message.data as PackageOffer[]
      return (
        <>
          <p className="message-text">{message.content}</p>
          <div className="package-grid">
            {offers.map((offer) => (
              <div className="package-card" key={offer.id}>
                <div className="package-name">{offer.label}</div>
                <div className="package-price">{offer.price}</div>
                <div className="package-description">{offer.description}</div>
                {offer.billing && (
                  <div className="package-billing">{offer.billing}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )
    }

    if (message.variant === 'cta') {
      return (
        <div className="cta-card">
          <span className="cta-icon">🚀</span>
          <span>{message.content}</span>
        </div>
      )
    }

    if (message.variant === 'summary' && Array.isArray(message.data)) {
      const rows = message.data as Array<{ label: string; value: string }>
      return (
        <>
          <p className="message-text">{message.content}</p>
          <div className="summary-card">
            {rows.map((row) => (
              <div className="summary-row" key={row.label}>
                <span className="summary-label">{row.label}</span>
                <span className="summary-value">{row.value || '—'}</span>
              </div>
            ))}
          </div>
        </>
      )
    }

    if (message.variant === 'widget' && message.data) {
      const widgetData = message.data as WidgetMessageData
      const selected = deriveSelectedPackageId()
      return (
        <>
          {message.content && <p className="message-text">{message.content}</p>}
          <SudarshanWidget
            {...widgetData}
            selectedPackage={selected ?? widgetData.selectedPackage}
            onPackagePick={handleWidgetPackagePick}
            onLeadSubmit={handleWidgetLeadSubmit}
            onLeadReset={handleWidgetLeadReset}
          />
        </>
      )
    }

    return (
      <p className="message-text">
        {message.content.split('\n').map((line, idx) => (
          <span key={idx}>
            {line}
            {idx !== message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  }

  return (
    <div className="app-shell">
      <div className="chat-shell">
        <header className="chat-header">
          <div className="brand-stack">
            <img className="brand-logo" src={LogoAsset} alt="Leeila AI emblem" />
            <div className="header-copy">
              <h1>Leeila AI</h1>
              <p>Customer Care & Sales Head for Sudarshan AI Labs</p>
            </div>
          </div>
          <div className="status-pill">Live demo</div>
        </header>

        <div className="messages" role="log" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender}`}
              data-variant={message.variant ?? 'text'}
            >
              <div className="message-bubble">{renderMessageContent(message)}</div>
              {message.quickReplies && message.quickReplies.length > 0 && (
                <div className="quick-replies">
                  {message.quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      className={`quick-reply ${reply.type ?? 'secondary'}`}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      disabled={isSendingLead && reply.type === 'primary'}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <div className="input-stack">
            <input
              type="text"
              className={`text-input ${isListening ? 'listening' : ''}`}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Type here... e.g., 'Mujhe onboarding chahiye'"
              aria-label="Send a message to Leeila AI"
            />
            {voiceTranscript && (
              <div className="voice-preview" role="status" aria-live="polite">
                <span className="voice-indicator">🎙️</span>
                <span>{voiceTranscript}</span>
              </div>
            )}
          </div>
          <div className="composer-actions">
            {isVoiceSupported && (
              <button
                type="button"
                className={`icon-button mic ${isListening ? 'active' : ''}`}
                onClick={toggleVoiceCapture}
                aria-pressed={isListening}
                aria-label={isListening ? 'Stop voice capture' : 'Start voice capture'}
                title={isListening ? 'Listening… tap to stop' : 'Speak to Leeila'}
              >
                🎙️
              </button>
            )}
            {isSpeechSupported && (
              <button
                type="button"
                className={`icon-button speaker ${autoVoiceResponses ? 'active' : ''}`}
                onClick={toggleVoiceResponses}
                aria-pressed={autoVoiceResponses}
                aria-label={
                  autoVoiceResponses
                    ? 'Disable assistant voice responses'
                    : 'Enable assistant voice responses'
                }
                title={
                  autoVoiceResponses ? 'Mute spoken responses' : 'Hear Leeila speak responses'
                }
              >
                🔊
              </button>
            )}
            <button type="submit" className="send-button">
              Send
            </button>
          </div>
        </form>

        <footer className="chat-footer">
          <span className="footer-title">Customer care &amp; sales:</span>
          <span>24x7 ticket desk &bull; Lead qualification &bull; Onboarding automation</span>
        </footer>
      </div>
    </div>
  )
}

export default App




