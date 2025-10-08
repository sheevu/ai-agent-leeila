export type SpeechRecognitionResultLike = {
  0?: {
    transcript: string
  }
  isFinal?: boolean
}

export type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultLike[]
}

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}
