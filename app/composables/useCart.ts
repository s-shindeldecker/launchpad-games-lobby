import { computed, ref, watch } from 'vue'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

const STORAGE_KEY = 'launchpad-cart'

const cartItems = ref<CartItem[]>([])
const isOpen = ref(false)
let hasLoaded = false

const randomPrice = () => {
  const min = 19
  const max = 39
  return Math.round(Math.random() * (max - min) + min)
}

const loadFromStorage = () => {
  if (typeof window === 'undefined') return
  if (hasLoaded) return
  hasLoaded = true
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as CartItem[]
    if (Array.isArray(parsed)) {
      cartItems.value = parsed
    }
  } catch {
    // Ignore malformed storage payloads.
  }
}

const persistToStorage = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems.value))
}

export const useCart = () => {
  loadFromStorage()

  watch(
    cartItems,
    () => {
      persistToStorage()
    },
    { deep: true }
  )

  const subtotal = computed(() =>
    cartItems.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  )

  const totalItems = computed(() =>
    cartItems.value.reduce((total, item) => total + item.quantity, 0)
  )

  const openDrawer = () => {
    isOpen.value = true
  }

  const closeDrawer = () => {
    isOpen.value = false
  }

  const addItem = (item: { id: string; name: string }) => {
    const existing = cartItems.value.find((entry) => entry.id === item.id)
    if (existing) {
      existing.quantity += 1
      return
    }
    cartItems.value.push({
      id: item.id,
      name: item.name,
      price: randomPrice(),
      quantity: 1
    })
  }

  const removeItem = (id: string) => {
    cartItems.value = cartItems.value.filter((item) => item.id !== id)
  }

  const clearCart = () => {
    cartItems.value = []
  }

  return {
    cartItems,
    isOpen,
    subtotal,
    totalItems,
    openDrawer,
    closeDrawer,
    addItem,
    removeItem,
    clearCart
  }
}
