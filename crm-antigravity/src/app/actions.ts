'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCustomers() {
  return await prisma.customer.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deals: true } } }
  })
}

export async function createCustomer(data: { name: string, email: string, company?: string }) {
  await prisma.customer.create({ data })
  revalidatePath('/customers')
  revalidatePath('/')
}

export async function deleteCustomer(id: string) {
  await prisma.deal.deleteMany({ where: { customerId: id } })
  await prisma.customer.delete({ where: { id } })
  revalidatePath('/customers')
  revalidatePath('/')
}

export async function getDeals() {
  return await prisma.deal.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    include: { customer: true } 
  })
}

export async function createDeal(data: { title: string, value: number, status: string, customerId: string }) {
  await prisma.deal.create({ data })
  revalidatePath('/deals')
  revalidatePath('/')
}

export async function updateDealStatus(id: string, status: string) {
  await prisma.deal.update({ where: { id }, data: { status } })
  revalidatePath('/deals')
  revalidatePath('/')
}

export async function deleteDeal(id: string) {
  await prisma.deal.delete({ where: { id } })
  revalidatePath('/deals')
  revalidatePath('/')
}
