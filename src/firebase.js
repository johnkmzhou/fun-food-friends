import firebase from 'firebase';

import { config } from './firebase.config.js'

firebase.initializeApp(config);
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const facebookProvider = new firebase.auth.FacebookAuthProvider();
export const auth = firebase.auth();
export default firebase;