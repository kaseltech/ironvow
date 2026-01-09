'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function VowSuitePage() {
  return (
    <div className="min-h-screen bg-[#0F2233] flex flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light tracking-wide text-[#F5F1EA] mb-2">
          The <span className="font-semibold text-[#C9A75A]">Vow</span> Suite
        </h1>
        <p className="text-[#8A9BAE] text-sm max-w-md">
          A collection of apps designed to help you commit to your goals and build lasting habits.
        </p>
      </div>

      {/* Apps Grid */}
      <div className="w-full max-w-2xl space-y-6">
        {/* IronVow */}
        <div className="bg-[#1A2B3C] rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <Image
              src="/logo.png"
              alt="IronVow"
              width={64}
              height={64}
              className="rounded-xl flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#F5F1EA] mb-1">
                <span className="text-[#8A9BAE]">Iron</span>
                <span className="text-[#C9A75A]">Vow</span>
              </h2>
              <p className="text-[#8A9BAE] text-sm mb-3">
                AI-powered workout generation that adapts to your equipment, goals, and training history.
                Get personalized workouts whether you're at the gym, home, or outdoors.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-[#0F2233] text-[#C9A75A] px-2 py-1 rounded">AI Workouts</span>
                <span className="text-xs bg-[#0F2233] text-[#C9A75A] px-2 py-1 rounded">Progress Tracking</span>
                <span className="text-xs bg-[#0F2233] text-[#C9A75A] px-2 py-1 rounded">Strength Standards</span>
              </div>
              <Link
                href="/login"
                className="inline-block bg-[#C9A75A] hover:bg-[#B8964A] text-[#0F2233] font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Open IronVow
              </Link>
            </div>
          </div>
        </div>

        {/* YearVow */}
        <div className="bg-[#1A2B3C] rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              🎯
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#F5F1EA] mb-1">
                <span className="text-[#8A9BAE]">Year</span>
                <span className="text-[#a855f7]">Vow</span>
              </h2>
              <p className="text-[#8A9BAE] text-sm mb-3">
                Track your New Year's resolutions and build habits that stick.
                Set goals, track progress, and stay accountable throughout the year.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-[#0F2233] text-[#a855f7] px-2 py-1 rounded">Goal Tracking</span>
                <span className="text-xs bg-[#0F2233] text-[#a855f7] px-2 py-1 rounded">Habit Building</span>
                <span className="text-xs bg-[#0F2233] text-[#a855f7] px-2 py-1 rounded">Progress Streaks</span>
              </div>
              <a
                href="https://yearvow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Visit YearVow
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-[#4A5568] text-xs mb-4">
          Built with commitment in mind
        </p>
        <Link
          href="/login"
          className="text-[#8A9BAE] hover:text-[#C9A75A] text-sm transition-colors"
        >
          ← Back to IronVow
        </Link>
      </div>
    </div>
  );
}
