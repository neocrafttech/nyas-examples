import { getCustomers, getDeals } from './actions'
import { Users, Briefcase, DollarSign, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const customers = await getCustomers()
  const deals = await getDeals()

  const totalValue = deals.reduce((acc, deal) => acc + deal.value, 0)
  const wonDeals = deals.filter(d => d.status === 'Won')
  const wonValue = wonDeals.reduce((acc, deal) => acc + deal.value, 0)

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Overview</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Monitor your CRM metrics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Customers</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-emerald-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Deals</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">{deals.length}</p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-indigo-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pipeline Value</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="group rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-100 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Won Value</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">${wonValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Recent Customers</h2>
          </div>
          <div className="space-y-3">
            {customers.slice(0, 5).map(c => (
              <div key={c.id} className="group flex items-center justify-between p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-inner">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{c.name}</p>
                    <p className="text-sm text-zinc-500">{c.email}</p>
                  </div>
                </div>
                {c.company && (
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full">
                    {c.company}
                  </span>
                )}
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-sm font-medium text-zinc-500 py-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">No customers yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-8 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Recent Deals</h2>
          </div>
          <div className="space-y-3">
            {deals.slice(0, 5).map(d => (
              <div key={d.id} className="group flex items-center justify-between p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{d.title}</p>
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {d.customer.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-black text-lg text-zinc-900 dark:text-white">${d.value.toLocaleString()}</span>
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${
                    d.status === 'Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    d.status === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
            {deals.length === 0 && (
              <p className="text-sm font-medium text-zinc-500 py-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">No deals yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
