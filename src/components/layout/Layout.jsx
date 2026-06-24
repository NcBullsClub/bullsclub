import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 xl:pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}
