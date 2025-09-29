import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import Button from '@/app/components/ui/Button';
import OrderingModal from '@/app/components/customer/OrderingModal';

export default function Home() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery');

  function openModal(m: 'delivery' | 'pickup') {
    setMode(m);
    setOpen(true);
  }

  return (
    <CustomerLayout>
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/10 to-rose-500/20 border border-white/10 backdrop-blur-xl">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Crave. Click. Enjoy.
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">
            Freshly crafted flavors at your fingertips. Choose delivery for cozy nights in or pickup for on-the-go vibes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => openModal('delivery')}>Order Delivery</Button>
            <Button variant="secondary" onClick={() => openModal('pickup')}>Order Pickup</Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-24 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
      </section>

      <OrderingModal open={open} onClose={() => setOpen(false)} mode={mode} />
    </CustomerLayout>
  );
}
