<template>
  <div>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black/40"
      @click="closeDrawer"
    ></div>
    <aside
      class="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-slate-950/95 p-6 text-sm text-slate-200 shadow-2xl transition-transform duration-300"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-fuchsia-200">Cart</p>
          <p class="mt-1 text-xs text-slate-400">
            {{ totalItems }} item{{ totalItems === 1 ? '' : 's' }}
          </p>
        </div>
        <button
          class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:text-white"
          @click="closeDrawer"
        >
          Close
        </button>
      </div>

      <div class="mt-6 flex-1 overflow-y-auto">
        <div v-if="!cartItems.length" class="text-slate-400">
          Your cart is empty.
        </div>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-white">{{ item.name }}</p>
                <p class="mt-1 text-xs text-slate-400">
                  ${{ item.price.toFixed(2) }} · Qty {{ item.quantity }}
                </p>
              </div>
              <button
                class="text-xs text-slate-400 transition hover:text-white"
                @click="removeItem(item.id)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t border-white/10 pt-4">
        <div class="flex items-center justify-between text-sm text-slate-300">
          <span>Subtotal</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>
        <button
          class="mt-4 w-full rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!cartItems.length"
          @click="handlePurchase"
        >
          Purchase
        </button>
        <p class="mt-2 text-xs text-slate-500">
          Demo checkout only. No payment processed.
        </p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { trackEvent } from '~/utils/analytics'
import { useCart } from '~/composables/useCart'

const { cartItems, isOpen, subtotal, totalItems, closeDrawer, removeItem, clearCart } =
  useCart()

const orderId = () => `order-${Date.now().toString(36)}`

const handlePurchase = () => {
  if (!cartItems.value.length) return
  const cartValue = Number(subtotal.value.toFixed(2))
  trackEvent('checkout_start', { cart_value: cartValue })
  trackEvent('purchase_complete', {
    order_id: orderId(),
    cart_value: cartValue,
    purchase_type: 'direct'
  })
  clearCart()
  closeDrawer()
}
</script>
