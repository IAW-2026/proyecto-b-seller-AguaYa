export default async function Home() {
    return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>AguaYa Seller</h1>
                <p style={{ marginBottom: 20, color: '#64748b' }}>Accedé al panel para gestionar ventas, productos y pedidos.</p>
                <a href="/sign-in" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 12, background: '#2563eb', color: 'white', textDecoration: 'none' }}>
                    Iniciar sesión
                </a>
            </div>
        </main>
    )
}
