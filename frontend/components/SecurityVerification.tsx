'use client';

import { ShieldCheck } from 'lucide-react';

interface SecurityVerificationProps {
  message?: string;
  subtext?: string;
}

export default function SecurityVerification({ 
  message = "Performing security verification",
  subtext = "This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot."
}: SecurityVerificationProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      {/* Main Content */}
      <div className="max-w-md w-full text-center space-y-8">
        {/* Verification Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.4)] animate-pulse" />
              <ShieldCheck className="absolute w-8 h-8 text-emerald-500" />
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white">
            {message}
          </h1>
          
          <p className="text-sm text-gray-400 leading-relaxed">
            {subtext}
          </p>
        </div>

        {/* Verification Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex items-center justify-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse" />
          <span className="text-gray-300 font-medium">Verifying...</span>
        </div>

        {/* Cloudflare Attribution */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="w-4 h-4 bg-gray-700 rounded-sm flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-400">CF</span>
          </div>
          <span>Protected by Cloudflare</span>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center space-x-6 text-xs">
          <button className="text-gray-500 hover:text-gray-300 transition-colors">
            Privacy
          </button>
          <button className="text-gray-500 hover:text-gray-300 transition-colors">
            Help
          </button>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
