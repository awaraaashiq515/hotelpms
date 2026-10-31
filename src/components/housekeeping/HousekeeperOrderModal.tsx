'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UtensilsCrossed, 
  BedDouble, 
  Receipt, 
  CheckCircle2, 
  ChefHat, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface ProductVariant {
  id: string
  name: string
  price: number
  portion?: string
}

interface Product {
  id: string
  name: string
  sellingPrice: number
  halfPrice?: number | null
  image?: string | null
  taxRate?: number | null
  category?: { id: string; name: string } | null
  variants?: ProductVariant[]
}

interface Table {
  id: string
  name: string
  status: string
  floor?: { name: string } | null
}

interface CartItem {
  id: string
  productId: string
  name: string
  unitPrice: number
  quantity: number
  variantId?: string | null
  variantName?: string | null
  portion?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  propertyCode: string
  propertyId?: string
  user: any
  wtToken: string
  rooms: any[]
  initialRoomNumber?: string
  onOrderPlaced?: () => void
}

export default function HousekeeperOrderModal({
  isOpen,
  onClose,
  propertyCode,
  propertyId,
  user,
  wtToken,
  rooms,
  initialRoomNumber,
  onOrderPlaced
}: Props) {
  // Order Type Mode: 'ROOM' | 'TABLE'
  const [orderMode, setOrderMode] = useState<'ROOM' | 'TABLE'>('ROOM')

  // Target destination
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>(initialRoomNumber || '')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [specialNote, setSpecialNote] = useState<string>('')
  const [postToFolio, setPostToFolio] = useState<boolean>(true)

  // Products & Tables data
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loadingData, setLoadingData] = useState<boolean>(false)

  // Filtering & Catalog
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Cart
  const [cart, setCart] = useState<Record<string, CartItem>>({})
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false)
  const [placingOrder, setPlacingOrder] = useState<boolean>(false)

  // Variant modal
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)

  // Initialize preselected room
  useEffect(() => {
    if (initialRoomNumber) {
      setSelectedRoomNumber(initialRoomNumber)
      setOrderMode('ROOM')
    }
  }, [initialRoomNumber])

  // Load products and tables when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoadingData(true)
      try {
        const headers: HeadersInit = {}
        if (wtToken) headers['Authorization'] = `Bearer ${wtToken}`

        // 1. Fetch Products
        const prodRes = await fetch(`/api/products?propertyCode=${encodeURIComponent(propertyCode)}`, { 
          headers, 
          cache: 'no-store' 
        })
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setProducts(prodData.data || prodData || [])
        }

        // 2. Fetch Tables
        const tableRes = await fetch(`/api/tables?showAll=true&propertyCode=${encodeURIComponent(propertyCode)}`, { 
          headers, 
          cache: 'no-store' 
        })
        if (tableRes.ok) {
          const tableData = await tableRes.json()
          setTables(tableData.data || tableData || [])
        }
      } catch (err) {
        console.error('Error fetching menu/tables:', err)
        toast.error('Failed to load menu items. Please check connection.')
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [isOpen, propertyCode, wtToken])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => {
      if (p.category?.name) set.add(p.category.name)
    })
    return ['all', ...Array.from(set)]
  }, [products])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category?.name === selectedCategory
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Cart Calculations
  const cartItemsList = useMemo(() => Object.values(cart), [cart])
  const cartTotalQty = useMemo(() => cartItemsList.reduce((acc, it) => acc + it.quantity, 0), [cartItemsList])
  const subtotal = useMemo(() => cartItemsList.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0), [cartItemsList])
  const taxAmount = useMemo(() => Math.round(subtotal * 0.05), [subtotal])
  const grandTotal = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount])

  // Add Item to Cart
  const addItemToCart = (product: Product, variant?: ProductVariant, portion?: string, price?: number) => {
    const unitPrice = price !== undefined ? price : (variant ? variant.price : product.sellingPrice)
    const key = variant ? `${product.id}-${variant.id}` : (portion ? `${product.id}-${portion}` : product.id)
    const displayName = variant ? `${product.name} (${variant.name})` : (portion ? `${product.name} (${portion})` : product.name)

    setCart(prev => {
      const existing = prev[key]
      if (existing) {
        return {
          ...prev,
          [key]: { ...existing, quantity: existing.quantity + 1 }
        }
      }
      return {
        ...prev,
        [key]: {
          id: product.id,
          productId: product.id,
          name: displayName,
          unitPrice,
          quantity: 1,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          portion: portion || (variant ? variant.portion || 'FULL' : 'FULL')
        }
      }
    })

    toast.success(`Added ${displayName}`, { duration: 1200 })
  }

  // Handle Product Card Click (Prompt variant if available)
  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantProduct(product)
    } else if (product.halfPrice && product.halfPrice > 0) {
      setVariantProduct(product)
    } else {
      addItemToCart(product)
    }
  }

  // Update Cart Qty
  const updateQuantity = (key: string, delta: number) => {
    setCart(prev => {
      const item = prev[key]
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return {
        ...prev,
        [key]: { ...item, quantity: newQty }
      }
    })
  }

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cartItemsList.length === 0) {
      toast.error('Cart is empty. Please select food items first.')
      return
    }

    if (orderMode === 'ROOM' && !selectedRoomNumber) {
      toast.error('Please select a Room Number for Room Service.')
      return
    }

    if (orderMode === 'TABLE' && !selectedTableId) {
      toast.error('Please select a Table for Dine-In.')
      return
    }

    setPlacingOrder(true)
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (wtToken) headers['Authorization'] = `Bearer ${wtToken}`

      if (orderMode === 'ROOM') {
        // Find folio for room if room object exists
        const matchedRoom = rooms.find(r => r.roomNumber === selectedRoomNumber || r.id === selectedRoomNumber)
        const folioId = matchedRoom?.checkIns?.[0]?.folioId || null
        const guestId = matchedRoom?.checkIns?.[0]?.guest?.id || null

        const payload = {
          roomNumber: selectedRoomNumber,
          orderType: 'ROOM_SERVICE',
          items: cartItemsList.map(item => ({
            productId: item.productId,
            name: item.name,
            qty: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.unitPrice * item.quantity
          })),
          subtotal,
          taxAmount,
          totalAmount: grandTotal,
          postToFolio,
          specialNote,
          guestId,
          folioId,
          servedById: user?.id,
          staffMemberId: user?.staffMember?.id || user?.id,
          propertyCode,
          propertyId: propertyId || user?.property?.id
        }

        const res = await fetch('/api/hotel/room-service', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        const data = await res.json()
        if (res.ok) {
          toast.success(data.message || `🛎️ Room Service Order placed for Room ${selectedRoomNumber}!`)
          setCart({})
          setShowCartDrawer(false)
          onOrderPlaced?.()
          onClose()
        } else {
          toast.error(data.error || data.message || 'Failed to place room service order.')
        }
      } else {
        // Table Order (Dine-In)
        const matchedTable = tables.find(t => t.id === selectedTableId)
        const payload = {
          restaurantTableId: selectedTableId,
          orderType: 'DINE_IN',
          propertyCode,
          propertyId: propertyId || user?.property?.id,
          staffMemberId: user?.staffMember?.id || user?.id,
          items: cartItemsList.map(item => ({
            id: item.productId,
            name: item.name,
            unitPrice: item.unitPrice,
            sellingPrice: item.unitPrice,
            quantity: item.quantity,
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            portion: item.portion || 'FULL'
          }))
        }

        const res = await fetch('/api/orders/save', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        const data = await res.json()
        if (res.ok) {
          toast.success(`🍳 Table Order placed for ${matchedTable?.name || 'Table'}! KOT Sent to Kitchen.`)
          setCart({})
          setShowCartDrawer(false)
          onOrderPlaced?.()
          onClose()
        } else {
          toast.error(data.error || data.message || 'Failed to place table order.')
        }
      }
    } catch (err: any) {
      console.error('Order submission error:', err)
      toast.error('Network error. Failed to place order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: 'rgba(5, 7, 12, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Outfit","Inter",-apple-system,sans-serif',
      color: '#f8fafc',
      maxWidth: 540,
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      {/* ─── MODAL HEADER ─── */}
      <div style={{
        padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 12px',
        background: 'linear-gradient(180deg, rgba(234,88,12,0.12) 0%, rgba(10,12,20,0.98) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 0 15px rgba(249,115,22,0.4)',
            flexShrink: 0
          }}>
            🍽️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Take Guest Order</span>
              <span style={{ fontSize: 9.5, background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#fb923c', padding: '1px 6px', borderRadius: 999, fontWeight: 800 }}>HK PORTAL</span>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
              Punch food & service directly to Kitchen & Billing
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ─── ORDER TYPE SELECTOR (ROOM vs TABLE) ─── */}
      <div style={{
        padding: '10px 16px',
        background: '#090c15',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: 8,
        flexShrink: 0
      }}>
        <button
          onClick={() => setOrderMode('ROOM')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: orderMode === 'ROOM' ? '1.5px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
            background: orderMode === 'ROOM' ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.1))' : 'rgba(255,255,255,0.03)',
            color: orderMode === 'ROOM' ? '#fdba74' : '#94a3b8',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s'
          }}
        >
          <BedDouble size={16} />
          <span>Room Order</span>
        </button>

        <button
          onClick={() => setOrderMode('TABLE')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: orderMode === 'TABLE' ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
            background: orderMode === 'TABLE' ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.1))' : 'rgba(255,255,255,0.03)',
            color: orderMode === 'TABLE' ? '#93c5fd' : '#94a3b8',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s'
          }}
        >
          <UtensilsCrossed size={16} />
          <span>Table Order</span>
        </button>
      </div>

      {/* ─── TARGET DESTINATION SELECTION (ROOM PICKER / TABLE PICKER) ─── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(15, 23, 42, 0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0
      }}>
        {orderMode === 'ROOM' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Room Number *
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#f97316', cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={postToFolio}
                  onChange={e => setPostToFolio(e.target.checked)}
                  style={{ accentColor: '#f97316' }}
                />
                Post to Room Folio
              </label>
            </div>
            <select
              value={selectedRoomNumber}
              onChange={e => setSelectedRoomNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                background: '#0e1424',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="">-- Choose Guest Room --</option>
              {rooms.map(r => {
                const guest = r.checkIns?.[0]?.guest
                const guestName = guest ? ` (${guest.firstName} ${guest.lastName})` : ''
                return (
                  <option key={r.id} value={r.roomNumber}>
                    Room {r.roomNumber} - {r.roomType?.name || 'Standard'}{guestName} [{r.status}]
                  </option>
                )
              })}
            </select>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Restaurant Table *
              </label>
            </div>
            <select
              value={selectedTableId}
              onChange={e => setSelectedTableId(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                background: '#0e1424',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="">-- Choose Table --</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.floor?.name ? `(${t.floor.name})` : ''} - [{t.status}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Optional Chef / Special Note */}
        <input
          type="text"
          placeholder="Special notes e.g. Less spicy, extra glasses, quick service..."
          value={specialNote}
          onChange={e => setSpecialNote(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            fontSize: 11,
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* ─── SEARCH & CATEGORY CHIPS ─── */}
      <div style={{
        padding: '10px 16px 6px',
        background: '#070911',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0
      }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '6px 10px',
          marginBottom: 8
        }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tea, snacks, curry, roti, water..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Horizontal Pills */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}>
          {categories.map(cat => {
            const isSel = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: isSel ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                  background: isSel ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.03)',
                  color: isSel ? '#fdba74' : '#94a3b8',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── PRODUCT LIST (SCROLLABLE GRID) ─── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loadingData ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 8, animation: 'spin 1s infinite' }}>⏳</div>
            Loading menu products & tables…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
            No menu products found. Check your search query.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, paddingBottom: 80 }}>
            {filteredProducts.map(product => {
              // Check if in cart
              const inCartItems = cartItemsList.filter(ci => ci.productId === product.id)
              const countInCart = inCartItems.reduce((acc, it) => acc + it.quantity, 0)

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  style={{
                    background: countInCart > 0 
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(15,23,42,0.6))'
                      : 'rgba(255,255,255,0.025)',
                    border: countInCart > 0 
                      ? '1.5px solid rgba(249,115,22,0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                >
                  {countInCart > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: '#f97316',
                      color: '#000',
                      fontSize: 9,
                      fontWeight: 900,
                      borderRadius: 999,
                      padding: '1px 6px',
                      boxShadow: '0 0 8px rgba(249,115,22,0.5)'
                    }}>
                      {countInCart} in cart
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', lineHeight: 1.3, marginBottom: 3 }}>
                      {product.name}
                    </div>
                    {product.category?.name && (
                      <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {product.category.name}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>
                      ₹{product.sellingPrice}
                      {product.halfPrice ? <span style={{ fontSize: 8.5, color: '#94a3b8', marginLeft: 2 }}>(Half: ₹{product.halfPrice})</span> : null}
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleProductClick(product)
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(249,115,22,0.3)'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── FLOATING BOTTOM CART BAR ─── */}
      {cartTotalQty > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          left: 12,
          right: 12,
          background: 'linear-gradient(135deg, #ea580c, #c2410c)',
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(234,88,12,0.5)',
          cursor: 'pointer',
          zIndex: 600,
          animation: 'slideUp 0.2s ease-out'
        }}
        onClick={() => setShowCartDrawer(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 10,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 900,
              color: '#fff'
            }}>
              {cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>
                ₹{grandTotal} <span style={{ fontSize: 9.5, opacity: 0.8 }}>(incl. tax)</span>
              </div>
              <div style={{ fontSize: 9.5, color: '#fed7aa', fontWeight: 700 }}>
                {orderMode === 'ROOM' ? `Room: ${selectedRoomNumber || 'Not Selected'}` : `Table: ${tables.find(t=>t.id===selectedTableId)?.name || 'Not Selected'}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', color: '#ea580c', borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 900 }}>
            <span>Review & Order</span>
            <ChevronRight size={14} />
          </div>
        </div>
      )}

      {/* ─── VARIANT / PORTION SELECTOR MODAL ─── */}
      {variantProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 800
        }}>
          <div style={{
            background: '#0d1322',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 540,
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{variantProduct.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Select portion or variant</div>
              </div>
              <button
                onClick={() => setVariantProduct(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {/* Full Portion */}
              <button
                onClick={() => {
                  addItemToCart(variantProduct, undefined, 'FULL', variantProduct.sellingPrice)
                  setVariantProduct(null)
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800 }}>Full Portion</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>₹{variantProduct.sellingPrice}</span>
              </button>

              {/* Half Portion if configured */}
              {variantProduct.halfPrice && variantProduct.halfPrice > 0 && (
                <button
                  onClick={() => {
                    addItemToCart(variantProduct, undefined, 'HALF', variantProduct.halfPrice!)
                    setVariantProduct(null)
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Half Portion</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>₹{variantProduct.halfPrice}</span>
                </button>
              )}

              {/* Variants array */}
              {variantProduct.variants?.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    addItemToCart(variantProduct, v)
                    setVariantProduct(null)
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{v.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8' }}>₹{v.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── REVIEW CART DRAWER ─── */}
      {showCartDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          zIndex: 900
        }}>
          <div style={{
            background: '#090d16',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 540,
            margin: '0 auto',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Order Summary & KOT</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  {orderMode === 'ROOM' ? `Room ${selectedRoomNumber || 'Not Chosen'}` : `${tables.find(t=>t.id===selectedTableId)?.name || 'Table Not Chosen'}`}
                </div>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', WebkitOverflowScrolling: 'touch' }}>
              {cartItemsList.map(item => {
                const key = item.variantId ? `${item.productId}-${item.variantId}` : (item.portion ? `${item.productId}-${item.portion}` : item.productId)
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>₹{item.unitPrice} each</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => updateQuantity(key, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={12} />
                      </button>

                      <span style={{ fontSize: 13, fontWeight: 900, minWidth: 18, textAlign: 'center' }}>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(key, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'rgba(249,115,22,0.2)',
                          border: '1px solid rgba(249,115,22,0.4)',
                          color: '#fb923c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                      </button>

                      <span style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', minWidth: 50, textAlign: 'right' }}>
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Bill Breakup */}
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                  <span>Taxes (5% GST)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#fff', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#34d399' }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Bottom Confirm Action */}
            <div style={{ padding: '14px 20px calc(20px + env(safe-area-inset-bottom, 0px))', background: '#070911', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                disabled={placingOrder}
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  background: placingOrder ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: placingOrder ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
                  fontFamily: 'inherit'
                }}
              >
                <ChefHat size={18} />
                <span>{placingOrder ? 'Sending Order to Kitchen…' : 'Confirm & Fire KOT to Kitchen 🍳'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

