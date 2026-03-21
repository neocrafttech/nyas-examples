import { getCustomers, createCustomer, deleteCustomer } from '../actions'
import { Plus, Trash2, Mail, Building } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Customers</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Manage your valuable customer relationships.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Customer List</h2>
            <div className="space-y-4">
              {customers.map(c => (
                <div key={c.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-inner">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-zinc-900 dark:text-white">{c.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</span>
                        {c.company && (
                          <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {c.company}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full">
                      {c._count.deals} {c._count.deals === 1 ? 'Deal' : 'Deals'}
                    </div>
                    <form action={async () => {
                      'use server'
                      await deleteCustomer(c.id)
                    }}>
                      <button type="submit" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="text-zinc-500 text-center py-8">No customers found. Add your first customer!</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/50 p-6 shadow-sm backdrop-blur-xl sticky top-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Add Customer</h2>
            <form action={async (formData) => {
              'use server'
              const name = formData.get('name') as string
              const email = formData.get('email') as string
              const company = formData.get('company') as string
              if (name && email) {
                await createCustomer({ name, email, company })
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name *</label>
                <input required type="text" name="name" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
                <input required type="email" name="email" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Company (Optional)</label>
                <input type="text" name="company" className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Acme Corp" />
              </div>
              <button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                <Plus className="w-5 h-5" />
                Add Customer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
