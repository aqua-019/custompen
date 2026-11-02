import { useEffect, useRef } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { CartProvider } from './lib/cart'
import Header from './components/Header'
import { ConceptBar, CartDialog, SearchDialog, Footer } from './components/Chrome'
import Home from './pages/Home'
import Workshops from './pages/Workshops'
import { WorkshopDetail, ProductDetail } from './pages/ItemDetail'
import Shop from './pages/Shop'
import Membership from './pages/Membership'
import Page from './pages/Page'
import Search from './pages/Search'

function Shell() {
  const searchRef = useRef(null)
  const loc = useLocation()
  const openSearch = () => searchRef.current && !searchRef.current.open && searchRef.current.showModal()
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [loc.pathname])
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <ConceptBar />
      <Header onSearch={openSearch} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <CartDialog />
      <SearchDialog dref={searchRef} />
      <ScrollRestoration />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/workshops', element: <Workshops /> },
      { path: '/workshops/:slug', element: <WorkshopDetail col="workshops" /> },
      { path: '/online-courses/:slug', element: <WorkshopDetail col="online-courses" /> },
      { path: '/penumbra-store', element: <Shop /> },
      { path: '/shop', element: <Shop /> },
      { path: '/penumbra-store/:slug', element: <ProductDetail /> },
      { path: '/new-products-2/:slug', element: <ProductDetail /> },
      { path: '/tintype-1/:slug', element: <ProductDetail /> },
      { path: '/digital-negatives-1/:slug', element: <ProductDetail /> },
      { path: '/membership-main', element: <Membership /> },
      { path: '/search', element: <Search /> },
      { path: '*', element: <Page /> },
    ],
  },
])

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  )
}
