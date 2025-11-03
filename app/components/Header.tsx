'use client';

import { UserButton, useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Header() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-indigo-100 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-[73px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <span className="text-2xl">✨</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Habit & Mood
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isLoaded ? (
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : isSignedIn ? (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            ) : (
              <>
                <SignInButton mode="redirect">
                  <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-all">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="redirect">
                  <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}