"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AgentPlanReview } from "@/components/agent-plan-review";

export function PresentationDashboard() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "in_review" | "resolved" | "all">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setThemeMode(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className={themeMode === "dark" ? "dark" : ""}>
      {/* Outer Shell: Soft framed background matching reference */}
      <div className="min-h-screen bg-[#edf2f7] dark:bg-[#070c18] p-3 sm:p-6 lg:p-10 font-sans transition-colors duration-200">
        
        {/* Main Floating Rounded Tablet Container */}
        <div className="max-w-[1440px] mx-auto bg-white dark:bg-[#0b1324] rounded-[32px] shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col lg:flex-row transition-colors duration-200">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/60 p-5 lg:p-6 flex flex-col justify-between shrink-0 bg-white dark:bg-[#0b1324]">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-xl bg-[#0ea5e9] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">Ziki</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#0ea5e9] -mt-1">Issue OS</span>
                </div>
              </div>

              {/* Search Bar with ⌘ K */}
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full pl-9 pr-12 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#0ea5e9] transition"
                />
                <div className="absolute right-2.5 top-2 flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  <span>⌘</span><span>K</span>
                </div>
              </div>

              {/* Nav Section: Work */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Work</div>
                
                <a href="#today" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-400">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Today</span>
                  </div>
                </a>

                <a href="#inbox" className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>Inbox</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#0ea5e9]">12</span>
                </a>

                <a href="#schedule" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Dispatch Feed</span>
                </a>

                <a href="#agents" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Agents</span>
                </a>
              </div>

              {/* Nav Section: Revenue and insight */}
              <div className="space-y-1 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Revenue and insight</div>
                
                <a href="#bounties" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  <span>Bounties & Points</span>
                </a>

                <a href="#settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </a>
              </div>
            </div>

            {/* Bottom Version Pill */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Ziki v2.4</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-5 sm:p-7 lg:p-9 space-y-7 bg-white dark:bg-[#0b1324] overflow-x-hidden">
            
            {/* TOP BAR: Tenant Pill, Date Pill & Header Action Icons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Location / Workspace Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Harborview · Zedu Web Project</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* Date Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Tue, Oct 27, 2026</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2.5">
                {/* Notification Bell */}
                <button className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                </button>

                {/* Help Icon */}
                <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Prominent Ask AI / Dispatch Agent Pill */}
                <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"/>
                  </svg>
                  <span>Dispatch Agent</span>
                </button>

                {/* Theme Toggle Pill */}
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
                >
                  <span className="text-amber-500">☀️</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-indigo-400">🌙</span>
                </button>

                {/* User Avatar Circle */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 ring-2 ring-slate-100 dark:ring-slate-800 cursor-pointer">
                  <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD HERO HEADER & ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Front desk
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tuesday, October 27 · 48 issues in triage, 2 claims in review, next dispatch at 9:00 AM.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm transition cursor-pointer">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Quick issue</span>
                </button>

                <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>New appointment</span>
                </button>
              </div>
            </div>

            {/* 4 SIGNATURE METRIC CARDS WITH DOT-MATRIX SPARKLINES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              
              {/* Card 1: Arrivals expected */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <span>Arrivals expected</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">48</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">↗ +4%</span>
                </div>

                {/* Dot-matrix Sparkline 1 */}
                <div className="pt-2 flex items-end gap-1.5 h-9">
                  {[2, 3, 5, 2, 4, 3, 6, 2, 5, 8].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end h-full">
                      {Array.from({ length: 8 }).map((_, r) => (
                        <span 
                          key={r} 
                          className={`w-1.5 h-1.5 rounded-full ${r >= 8 - h ? "bg-[#0284c7]" : "bg-slate-100 dark:bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Checked in */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <span>Checked in</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">2</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">↗ +2</span>
                </div>

                {/* Dot-matrix Sparkline 2 */}
                <div className="pt-2 flex items-end gap-1.5 h-9">
                  {[3, 6, 2, 4, 7, 3, 5, 6, 2, 4].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end h-full">
                      {Array.from({ length: 8 }).map((_, r) => (
                        <span 
                          key={r} 
                          className={`w-1.5 h-1.5 rounded-full ${r >= 8 - h ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Waiting now */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <span>Waiting now</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">1</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">↘ -1</span>
                </div>

                {/* Dot-matrix Sparkline 3 */}
                <div className="pt-2 flex items-end gap-1.5 h-9">
                  {[1, 2, 4, 3, 5, 2, 3, 6, 4, 2].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end h-full">
                      {Array.from({ length: 8 }).map((_, r) => (
                        <span 
                          key={r} 
                          className={`w-1.5 h-1.5 rounded-full ${r >= 8 - h ? "bg-orange-500" : "bg-slate-100 dark:bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Insurance to verify */}
              <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <span>Insurance to verify</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">3</span>
                  <span className="text-xs font-semibold text-rose-500">↗ +1</span>
                </div>

                {/* Dot-matrix Sparkline 4 */}
                <div className="pt-2 flex items-end gap-1.5 h-9">
                  {[2, 4, 3, 5, 4, 2, 3, 5, 4, 6].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end h-full">
                      {Array.from({ length: 8 }).map((_, r) => (
                        <span 
                          key={r} 
                          className={`w-1.5 h-1.5 rounded-full ${r >= 8 - h ? "bg-amber-500" : "bg-slate-100 dark:bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SPLIT SECTION: MAIN TABLE (70%) & RIGHT SIDEBAR (30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: TABLE */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Table Header: Title + Sub-search & Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Arrivals</h2>
                    <p className="text-xs text-slate-400">All clinicians, Main campus</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find a patient by name, DOB, phone or MRN" 
                        className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-56 sm:w-64 transition"
                      />
                    </div>
                    <button className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 transition cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pb-2 text-slate-500">
                  <button 
                    onClick={() => setActiveTab("upcoming")}
                    className={`cursor-pointer transition flex items-center gap-1.5 ${activeTab === "upcoming" ? "text-slate-900 dark:text-slate-100 font-bold border-b-2 border-slate-900 dark:border-slate-100 pb-2 -mb-2.5" : "hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    <span>Upcoming</span>
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">46</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("in_review")}
                    className={`cursor-pointer transition flex items-center gap-1.5 ${activeTab === "in_review" ? "text-slate-900 dark:text-slate-100 font-bold border-b-2 border-slate-900 dark:border-slate-100 pb-2 -mb-2.5" : "hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    <span>Checked in</span>
                    <span className="text-[11px] font-bold">2</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("resolved")}
                    className={`cursor-pointer transition flex items-center gap-1.5 ${activeTab === "resolved" ? "text-slate-900 dark:text-slate-100 font-bold border-b-2 border-slate-900 dark:border-slate-100 pb-2 -mb-2.5" : "hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    <span>Completed</span>
                    <span className="text-[11px] font-bold">0</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("all")}
                    className={`cursor-pointer transition flex items-center gap-1.5 ${activeTab === "all" ? "text-slate-900 dark:text-slate-100 font-bold border-b-2 border-slate-900 dark:border-slate-100 pb-2 -mb-2.5" : "hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    <span>All today</span>
                    <span className="text-[11px] font-bold">48</span>
                  </button>
                </div>

                {/* DATA TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                        <th className="py-2.5 pr-4 font-semibold">Time</th>
                        <th className="py-2.5 px-4 font-semibold">Patient</th>
                        <th className="py-2.5 px-4 font-semibold">Clinician and visit</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 pl-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      
                      {/* Row 1 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">8:00 AM</div>
                          <div className="text-[11px] text-slate-400">20 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">LA</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Linda Alvarez</div>
                              <div className="text-[11px] text-slate-400">64 y, DOB 06/02/1962</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Marcus Reed</div>
                          <div className="text-[11px] text-slate-400">Follow up, Primary Care</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0284c7] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                            In consultation
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => setIsPlanModalOpen(true)}
                            className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            View visit
                          </button>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">8:30 AM</div>
                          <div className="text-[11px] text-slate-400">30 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">RC</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Robert Chen</div>
                              <div className="text-[11px] text-slate-400">71 y, DOB 01/19/1955</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Olivia Bennett</div>
                          <div className="text-[11px] text-slate-400">Echo review, Cardiology</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Waiting 7 min
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Notify nurse
                          </button>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">9:00 AM</div>
                          <div className="text-[11px] text-slate-400">30 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">EF</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Emily Foster</div>
                              <div className="text-[11px] text-slate-400">42 y, DOB 09/30/1984</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Daniel Park</div>
                          <div className="text-[11px] text-slate-400">Post op review, Orthopedics</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0284c7] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Check in
                          </button>
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">9:30 AM</div>
                          <div className="text-[11px] text-slate-400">45 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold text-xs">AT</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Aisha Thompson</div>
                              <div className="text-[11px] text-slate-400">35 y, DOB 12/08/1990</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Sophia Carter</div>
                          <div className="text-[11px] text-slate-400">New patient, Dermatology</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0284c7] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Check in
                          </button>
                        </td>
                      </tr>

                      {/* Row 5 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">10:00 AM</div>
                          <div className="text-[11px] text-slate-400">20 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-xs">MO</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Michael O&apos;Brien</div>
                              <div className="text-[11px] text-slate-400">47 y, DOB 04/11/1979</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Marcus Reed</div>
                          <div className="text-[11px] text-slate-400">Annual physical, Primary Care</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0284c7] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Check in
                          </button>
                        </td>
                      </tr>

                      {/* Row 6: Open slot */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition bg-slate-50/30 dark:bg-slate-900/20">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">10:30 AM</div>
                          <div className="text-[11px] text-slate-400">45 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs">--</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Open slot</div>
                              <div className="text-[11px] text-slate-400">Cancelled at 7:58 AM</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Olivia Bennett</div>
                          <div className="text-[11px] text-slate-400">New patient slot, Cardiology</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Available
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Book
                          </button>
                        </td>
                      </tr>

                      {/* Row 7 */}
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-medium whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-slate-100">11:00 AM</div>
                          <div className="text-[11px] text-slate-400">30 min</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">GN</div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">Grace Nakamura</div>
                              <div className="text-[11px] text-slate-400">29 y, DOB 07/22/1997</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Sophia Carter</div>
                          <div className="text-[11px] text-slate-400">Follow up, Dermatology</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#0284c7] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <button className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer">
                            Check in
                          </button>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Next 7 of 46 upcoming arrivals</span>
                  <a href="#schedule" className="font-semibold text-[#0284c7] hover:underline flex items-center gap-1">
                    <span>Open full schedule</span>
                    <span>→</span>
                  </a>
                </div>

              </div>

              {/* RIGHT COLUMN: 3 CARDS */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* Right Card 1: Arrivals by hour (Dot-matrix column chart!) */}
                <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Arrivals by hour</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Booked visits per hour, current hour highlighted</p>

                  {/* Hourly Columns */}
                  <div className="pt-6 pb-2 flex items-end justify-between gap-2 h-36">
                    {[
                      { hour: "8", dots: 8, active: true },
                      { hour: "9", dots: 4, active: false },
                      { hour: "10", dots: 6, active: false },
                      { hour: "11", dots: 5, active: false },
                      { hour: "12", dots: 3, active: false },
                      { hour: "1", dots: 4, active: false },
                      { hour: "2", dots: 6, active: false },
                      { hour: "3", dots: 3, active: false },
                      { hour: "4", dots: 2, active: false },
                    ].map((col) => (
                      <div key={col.hour} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex flex-col gap-1 justify-end h-24">
                          {Array.from({ length: 8 }).map((_, r) => {
                            const isFilled = r >= 8 - col.dots;
                            return (
                              <span 
                                key={r}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isFilled 
                                    ? col.active ? "bg-[#0ea5e9]" : "bg-slate-300 dark:bg-slate-700" 
                                    : "bg-slate-100 dark:bg-slate-800/60"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className={`text-[11px] font-mono mt-2 ${col.active ? "font-bold text-[#0ea5e9]" : "text-slate-400"}`}>
                          {col.hour}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card 2: Open slots today */}
                <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Open slots today</h3>
                    <p className="text-xs text-slate-400">From cancellations and gaps</p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">10:30 AM</div>
                        <div className="text-[11px] text-slate-400">Dr. Olivia Bennett, Cardio…</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                        <span className="w-1 h-1 rounded-full bg-[#0284c7]"></span>
                        New patient
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">2:00 PM</div>
                        <div className="text-[11px] text-slate-400">Dr. Daniel Park, Orthopedics</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        Follow up
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card 3: Before 10 AM */}
                <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0e1a33] shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Before 10 AM</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Verify 3 insurance plans</div>
                          <div className="text-[11px] text-slate-400">Emily Foster, Aisha Thompson, +1</div>
                        </div>
                      </div>
                      <span className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 text-sm">›</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">2 intake forms incomplete</div>
                          <div className="text-[11px] text-slate-400">Sent by text, not yet returned</div>
                        </div>
                      </div>
                      <span className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 text-sm">›</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </main>

        </div>

        {/* MODAL: INTEGRATED HAI AGENT PLAN REVIEW */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-3xl relative">
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="absolute -top-10 right-0 text-white/80 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>[Close ESC]</span>
              </button>
              
              <AgentPlanReview 
                issueNumber={1042}
                issueTitle="Race condition in event cursor during concurrent polling"
                agentName="agent-sentinel"
                personName="henryuks"
                branchName="fix/1042-event-cursor"
                filesChanged={2}
                additions={50}
                deletions={4}
                estimatedDuration="20m"
                onAuthorize={() => {
                  setTimeout(() => setIsPlanModalOpen(false), 2000);
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}