"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "@/src/lib/firebase";
import { logout, signInWithGoogle } from "@/src/services/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
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
