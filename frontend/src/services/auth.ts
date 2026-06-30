import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logout = async () => {
  const auth = getFirebaseAuth();
  await signOut(auth);
};
