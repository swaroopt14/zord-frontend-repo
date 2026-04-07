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
    <DashboardLayout>
      <div className="font-sans">
        <section className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-none text-[#243225] tracking-tight">Overview</h1>
          <button className="rounded-lg border border-black/10 p-2 text-[#5C6455] transition-colors hover:bg-black/5 hover:text-[#243225]">
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
