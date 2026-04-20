function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const ENV = {
  apiUrl: required('VITE_API_URL'),
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY'),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: required('VITE_FIREBASE_PROJECT_ID'),
    appId: required('VITE_FIREBASE_APP_ID'),
    messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  },
} as const

export { required }
