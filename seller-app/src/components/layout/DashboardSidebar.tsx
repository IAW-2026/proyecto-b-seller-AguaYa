import React from 'react'
import Link from 'next/link'
import LogoutButton from '../LogoutButton'

export default function DashboardSidebar() {
  return (
    <aside style={{ width: 240, padding: 16, borderRight: '1px solid #eee' }}>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 8 }}><Link href="/dashboard/overview">Overview</Link></li>
          <li style={{ marginBottom: 8 }}><Link href="/dashboard/sales">Sales</Link></li>
          <li style={{ marginBottom: 8 }}><Link href="/dashboard/products">Products</Link></li>
          <li style={{ marginBottom: 8 }}><Link href="/dashboard/orders">Orders</Link></li>
          <li style={{ marginBottom: 8 }}><Link href="/dashboard/settings">Settings</Link></li>
        </ul>
      </nav>
      <hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />
      <LogoutButton />
    </aside>
  )
}
