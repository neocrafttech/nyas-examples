import { getDeals, getCustomers, createDeal, deleteDeal, updateDealStatus } from '../actions'
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DealsPage() {
  const deals = await getDeals()
  const customers = await getCustomers()

  const columns = ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost']

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Deals</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Track and manage your sales pipeline.</p>
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Create New Deal</h2>
        <form action={async (formData) => {
          'use server'
          const title = formData.get('title') as string
          const valueStr = formData.get('value') as string
          const customerId = formData.get('customerId') as string
          const status = formData.get('status') as string

          if (title && valueStr && customerId && status) {
            const value = parseFloat(valueStr)
            await createDeal({ title, value, customerId, status })
          }
        }} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Deal Title</label>
            <input required type="text" name="title" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Website Redesign" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Value ($)</label>
            <input required type="number" step="0.01" name="value" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="5000" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Customer</label>
            <select required name="customerId" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
              <option value="">Select...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Stage</label>
            <select required name="status" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
              <Plus className="w-5 h-5" />
              Add Deal
            </button>
          </div>
        </form>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 snap-x min-h-[500px]">
        {columns.map(col => {
          const colDeals = deals.filter(d => d.status === col)
          const colTotal = colDeals.reduce((sum, d) => sum + d.value, 0)
          
          return (
            <div key={col} className="w-80 shrink-0 snap-start flex flex-col pt-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                  {col}
                  <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full">{colDeals.length}</span>
                </h3>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  ${colTotal.toLocaleString()}
                </span>
              </div>
              
              <div className="flex-1 rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/30 p-3 space-y-3 min-h-[400px]">
                {colDeals.map(deal => (
                  <div key={deal.id} className="group bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all hover:border-emerald-500/30 relative">
                    <p className="font-bold text-zinc-900 dark:text-white mb-1">{deal.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{deal.customer.name}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ${deal.value.toLocaleString()}
                      </span>
                      
                      <div className="flex items-center gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {columns.indexOf(col) > 0 && (
                          <form action={async () => {
                            'use server'
                            const currentIdx = columns.indexOf(col)
                            await updateDealStatus(deal.id, columns[currentIdx - 1])
                          }}>
                            <button type="submit" className="p-1 px-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors" title="Move Back">
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        {columns.indexOf(col) < columns.length - 1 && (
                          <form action={async () => {
                            'use server'
                            const currentIdx = columns.indexOf(col)
                            await updateDealStatus(deal.id, columns[currentIdx + 1])
                          }}>
                            <button type="submit" className="p-1 px-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-700 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Move Forward">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                        <form action={async () => {
                          'use server'
                          await deleteDeal(deal.id)
                        }}>
                          <button type="submit" className="p-1 px-2 ml-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Deal">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
                {colDeals.length === 0 && (
                  <div className="h-24 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">
                    Empty
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
