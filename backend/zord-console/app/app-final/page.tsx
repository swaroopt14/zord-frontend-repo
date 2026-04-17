import {
  CustomersCard,
  DashboardLayout,
  InsightCard,
  PaymentsCard,
  RetentionCard,
  TopMetricsToolbar,
  TransactionsCard,
  VolumeCard,
} from '@/components/fintech-dashboard'


export default function AppFinalPage() {
  return (
    <DashboardLayout
      pageStyle={{
        color: '#E2E8F0',
        backgroundColor: '#091019',
        backgroundImage:
          'radial-gradient(circle at 16% 10%, rgba(37,99,235,0.14), transparent 26%), radial-gradient(circle at 84% 14%, rgba(148,163,184,0.12), transparent 24%), radial-gradient(circle at 50% 72%, rgba(30,41,59,0.42), transparent 34%), linear-gradient(180deg, #091019 0%, #0B1220 100%)',
      }}
    >
      <div className="font-sans">
        <section className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-none tracking-tight text-[#F8FAFC]">Overview</h1>
          <button className="rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.08)] p-2 text-[#CBD5E1] shadow-[0_12px_28px_rgba(2,6,23,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors hover:bg-[rgba(255,255,255,0.12)] hover:text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v2m0 8v2m-6-6h2m8 0h2m-1.657-5.657-1.414 1.414m-6.586 6.586-1.414 1.414m0-11.314 1.414 1.414m6.586 6.586 1.414 1.414" />
            </svg>
          </button>
        </section>

        <TopMetricsToolbar />

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8 xl:h-[580px]">
            <PaymentsCard />
          </div>

          <div className="xl:col-span-4 xl:h-[580px]">
            <VolumeCard />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-4 xl:h-[440px]">
            <RetentionCard />
          </div>

          <div className="xl:col-span-4">
            <div className="grid grid-cols-1 gap-[10px] xl:grid-rows-[210px_220px]">
              <div className="h-[210px]">
                <TransactionsCard />
              </div>
              <div className="h-[220px]">
                <CustomersCard />
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 xl:h-[440px]">
            <InsightCard />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
