export {}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => any
  }
}
