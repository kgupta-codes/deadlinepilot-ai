"use client";

import { useState } from "react";
import { signInWithGoogle } from "../src/services/auth";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const handleLogin = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">
        DeadlinePilot AI
      </h1>

      {!user ? (
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="text-center">
          <img
            src={user.photoURL}
            alt="profile"
            className="w-20 h-20 rounded-full mx-auto"
          />
          <h2 className="mt-4 text-xl">{user.displayName}</h2>
          <p>{user.email}</p>
        </div>
      )}
    </main>
  );
}
