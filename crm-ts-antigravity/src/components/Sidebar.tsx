'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase } from 'lucide-react'
import clsx from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { href: '/customers', label: 'Customers', icon: Users, color: 'text-blue-500' },
    { href: '/deals', label: 'Deals', icon: Briefcase, color: 'text-emerald-500' },
  ]

  return (
    <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Nyas CRM
        </h1>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1">
        {links.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? color : "text-zinc-400 dark:text-zinc-500")} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mx-4 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
          System
        </div>
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Powered by Nyas
        </div>
      </div>
    </div>
  )
}
