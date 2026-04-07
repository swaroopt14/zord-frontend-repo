'use client'

import { useState } from 'react'
import { Search, Bell, ChevronDown, Plus } from 'lucide-react'
import dynamic from 'next/dynamic'
import PaymentsChart from '@/components/PaymentsChart'
import Chart3D from '@/components/Chart3D'
import RetentionChart from '@/components/RetentionChart'
import TransactionsWidget from '@/components/TransactionsWidget'
import CustomersWidget from '@/components/CustomersWidget'
import GrossVolumeWidget from '@/components/GrossVolumeWidget'
import InsightCard from '@/components/InsightCard'

export default function DashboardClient() {
  const [activeNav, setActiveNav] = useState('Home')

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 1.5L3 6v8c0 5.5 7 8.5 7 8.5s7-3 7-8.5V6l-7.5-4.5zm0 14l-4-2.67V6.5l4-2.67 4 2.67v5.83l-4 2.67z" />
                </svg>
              </div>
              <span className="text-xl font-bold">zentra</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {['Home', 'Payments', 'Balances', 'Customers', 'Products', 'Billing', 'Reports', 'Connect'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className={`px-4 py-2 rounded transition-colors ${
                    activeNav === item
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center overflow-hidden">
                <span className="text-white font-bold text-sm">JD</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">Overview</h1>
            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Jan 01 - July 31</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <span className="text-gray-400">compared to</span>

            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Aug 01 - Dec 31</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
              <span className="text-sm">Daily</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <button className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200 hover:bg-gray-50 transition-colors">
              <span className="text-sm">Add widget</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payments Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <PaymentsChart />
          </div>

          {/* Gross Volume */}
          <GrossVolumeWidget />
        </div>

        {/* 3D Payments Chart */}
        <div className="mb-8">
          <Chart3D />
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RetentionChart />
          
          <div className="space-y-6">
            <TransactionsWidget />
            <CustomersWidget />
          </div>
        </div>

        {/* Insight Card */}
        <div className="mt-8">
          <InsightCard />
        </div>
      </main>
    </>
  )
}
