"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { getFirebaseAuth } from "@/src/lib/firebase";
import { logout, signInWithGoogle } from "@/src/services/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const loggedInUser = await signInWithGoogle();
      const auth = getFirebaseAuth();
      setUser(auth.currentUser ?? loggedInUser);
      setAuthMessage("Signed in. Your deadline workspace is ready.");
    } catch (error) {
      console.error(error);
      setAuthMessage("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    setAuthMessage("");
  };

  return {
    authMessage,
    loading,
    login,
    setAuthMessage,
    signOut,
    user,
  };
};
