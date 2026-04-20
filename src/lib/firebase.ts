import { getAuth } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'

import { ENV } from './env'

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        apiKey: ENV.firebase.apiKey,
        authDomain: ENV.firebase.authDomain,
        projectId: ENV.firebase.projectId,
        appId: ENV.firebase.appId,
        messagingSenderId: ENV.firebase.messagingSenderId,
      })

export const firebaseAuth = getAuth(firebaseApp)

export { firebaseApp }
