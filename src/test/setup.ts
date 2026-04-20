import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api/v1')
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-auth-domain')
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id')
vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id')
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'test-sender-id')
