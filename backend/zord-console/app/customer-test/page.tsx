'use client'

const activityBars = [
  40, 58, 48, 70, 56, 46, 74, 52, 66, 82, 112, 128, 144, 164, 148, 156, 136, 116, 102, 86, 72, 60, 80, 68,
]

const healthRows = [
  { date: '12 Aug 2025', calories: '250 kcal', weight: '0.92', avgHr: '0.92', lowHr: '0.92', highHr: '0.92', cardio: '1.5h active' },
  { date: '11 Aug 2025', calories: '228 kcal', weight: '0.89', avgHr: '0.88', lowHr: '0.84', highHr: '0.91', cardio: '1.2h active' },
]

export default function CustomerTestDashboardPage() {
  return (
    <main
      className="min-h-screen p-3 lg:pr-3"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif' }}
    >
      <div className="overflow-hidden rounded-[14px] border border-slate-300/90 bg-[#eef0f3] shadow-[0_24px_44px_rgba(15,23,42,0.16)]">
        <section className="relative overflow-hidden bg-[#090d13] text-white">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 95% at 18% 0%, rgba(148,163,184,0.16) 0%, transparent 45%), radial-gradient(130% 120% at 88% 22%, rgba(148,163,184,0.2) 0%, transparent 52%), repeating-radial-gradient(circle at 80% 42%, rgba(255,255,255,0.1) 0 1px, rgba(255,255,255,0.02) 1px 22px, transparent 22px 56px)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/35 backdrop-blur-[2px]" />

          <div className="relative z-10 px-4 pb-0 pt-4 lg:px-5">
            <div className="flex min-h-[250px] flex-col justify-between gap-4 lg:flex-row">
              <div>
                <p className="text-[17px] text-slate-300">Monday, 31 Mar 2026</p>
                <h1 className="mt-2 leading-[0.94] tracking-tight">
                  <span className="block text-[62px] font-medium">Good Morning,</span>
                  <span className="block font-serif text-[62px] italic">Swaroop.</span>
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'System Healthy', icon: '🟢' },
                    { label: '3 Pending Signals', icon: '🟡' },
                    { label: 'Evidence Ready', icon: '🟣' },
                  ].map((status) => (
                    <span
                      key={status.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] text-slate-100"
                    >
                      <span aria-hidden>{status.icon}</span>
                      {status.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 pb-3 lg:items-end">
                <button className="rounded-full border border-white/25 bg-white/15 px-5 py-2.5 text-[16px] font-medium text-white shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
                  ✈ Create Test Intent
                </button>
                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-[13px] text-slate-100">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">Z</span>
                  <span className="leading-tight">
                    <span className="block text-slate-300">Monitored by</span>
                    <span className="font-medium text-white">Zord Observability</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="h-3 border-t border-white/12" />
          </div>
        </section>

        <section className="bg-[#f2f3f5] p-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between text-[14px] text-slate-500">
                <span>◔ Envelope Ingestion Tracker</span>
                <span>•••</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Envelope ingestion</p>
              <div className="mt-1 flex items-end gap-2.5">
                <p className="text-[54px] font-semibold leading-none text-slate-900">28,953</p>
                <p className="pb-1 text-[18px] text-slate-500">Raw Envelopes Received</p>
              </div>
              <p className="mt-1 text-sm font-medium text-[#8b5cf6]">+10% vs last hour</p>

              <div className="relative mt-3 rounded-xl bg-[#fafafa] p-3">
                <div className="absolute right-4 top-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                  <p className="font-semibold text-slate-800">Webhook Source</p>
                  <p className="mt-1 text-slate-600">412 envelopes</p>
                  <p className="text-slate-500">Tenant: <span className="font-semibold text-slate-700">merchant_A</span></p>
                </div>

                <div className="mt-7 flex h-[136px] items-end gap-[6px]">
                  {activityBars.map((height, index) => {
                    const highlighted = index >= 10 && index <= 16
                    return (
                      <span
                        key={`${height}-${index}`}
                        className={`w-[11px] rounded-t-[5px] ${highlighted ? 'bg-gradient-to-b from-[#ba8dfb] to-[#8b5cf6]' : 'bg-[#e7e9ee]'}`}
                        style={{ height: `${height}px` }}
                      />
                    )
                  })}
                </div>

                <div className="mt-2.5 flex justify-between px-1 text-xs text-slate-400">
                  <span>API</span>
                  <span>CSV</span>
                  <span className="font-semibold text-[#8b5cf6]">Webhook</span>
                  <span>File</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">Hourly Avg</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">1,203</p>
                  <p className="mt-1 text-xs text-slate-500">envelopes/hr</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">Processing Latency</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">242</p>
                  <p className="mt-1 text-xs text-slate-500">ms</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">DLQ Events</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">11</p>
                  <p className="mt-1 text-xs text-slate-500">events</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between text-[14px] text-slate-500">
                <span>◔ Canonical Intent Pipeline</span>
                <span>•••</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Intent Processing</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-[54px] font-semibold leading-none text-slate-900">18,923</p>
                <p className="pb-1 text-base text-slate-400">Canonical Intents</p>
              </div>

              <p className="mt-3 text-xs font-medium tracking-wide text-slate-500">Envelope → NIR → Canonical → Tokenized</p>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div className="h-full w-[78%] rounded-full bg-[#f2aa36]" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-slate-500">Validated</p>
                  <p className="text-[42px] leading-none text-slate-900">17,845</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Confidence</p>
                  <p className="text-[42px] leading-none text-slate-900">0.96</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">DLQ Intents</p>
                  <p className="text-[42px] leading-none text-slate-900">432</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ready for Relay</p>
                  <p className="text-[42px] leading-none text-slate-900">18,102</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="h-8 w-8 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(74,222,128,0.78)]" />
                <p className="text-sm text-emerald-800">Great system health. Intent engine processing normally with high confidence mappings.</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between text-[14px] text-slate-500">
                <span>♡ Outcome Fusion State</span>
                <span>•••</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Outcome fusion</p>
              <div className="mt-1 flex items-end gap-2.5">
                <p className="text-[54px] font-semibold leading-none text-slate-900">85.3%</p>
                <p className="pb-1 text-[18px] text-slate-500">Finalized Payments</p>
              </div>

              <div className="mt-3 flex justify-end gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#35a0ff]" />
                  Provisional Success
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#2445db]" />
                  Confirmed Success
                </span>
              </div>

              <div className="mt-3 h-[158px]">
                <svg viewBox="0 0 360 150" className="h-full w-full">
                  <path d="M0 84 C38 84 52 42 90 42 C130 42 126 120 168 120 C212 120 209 62 252 62 C292 62 304 84 360 84" fill="none" stroke="#35a0ff" strokeWidth="2.5" />
                  <path d="M0 84 C38 84 56 118 95 118 C134 118 136 64 176 64 C216 64 220 102 260 102 C300 102 316 84 360 84" fill="none" stroke="#2445db" strokeWidth="2.5" />
                </svg>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">Provisional</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">72</p>
                  <p className="mt-1 text-xs text-slate-500">events</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">Confirmed</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">112</p>
                  <p className="mt-1 text-xs text-slate-500">events</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-3">
                  <p className="text-xs text-slate-500">Conflicts</p>
                  <p className="mt-1.5 text-[38px] leading-none text-slate-900">4</p>
                  <p className="mt-1 text-xs text-slate-500">events</p>
                </div>
              </div>
            </article>
          </div>

          <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[36px] font-medium text-slate-900">Health log</h3>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm text-slate-700">This month ▼</button>
                <button className="rounded-full bg-[#111318] px-5 py-2 text-sm font-medium text-white">⬇ Download records</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['Date', 'Calories burned', 'Body weight', 'Avg. HR', 'Lowest HR', 'Highest HR', 'Cardio Zone'].map((head) => (
                      <th key={head} className="border-b border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-500">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {healthRows.map((row) => (
                    <tr key={row.date}>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.date}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.calories}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.weight}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.avgHr}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.lowHr}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.highHr}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700">{row.cardio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
