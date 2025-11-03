import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-73px)] py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Continue your journey to better habits</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all",
                formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all",
                footerActionLink: "text-indigo-600 hover:text-indigo-700",
                identityPreviewEditButton: "text-indigo-600 hover:text-indigo-700",
                formFieldInput: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}