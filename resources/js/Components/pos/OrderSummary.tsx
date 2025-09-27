type OrderItem = { id: string; name: string; qty: number; price: number };

type Props = { order?: { startTime: string; table?: any; customer?: any; items: OrderItem[] } };

export default function OrderSummary({ order = { startTime: new Date().toISOString(), items: [] } }: Props) {
  const subtotal = order.items.reduce((s, it) => s + it.qty * it.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Current Order</h2>
          <span className="text-sm text-gray-500">{new Date(order.startTime).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {order.items.length === 0 && (
          <div className="text-sm text-gray-500">No items added.</div>
        )}
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-gray-500">{it.qty} x ${it.price.toFixed(2)}</div>
            </div>
            <div className="font-semibold">${(it.qty * it.price).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-gray-700 p-4 space-y-2">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
        <div className="mt-3 space-y-2">
          <button className="w-full px-4 py-2 bg-primary text-white rounded-sm">Pay</button>
          <button className="w-full px-4 py-2 border rounded-sm">Save Order</button>
        </div>
      </div>
    </div>
  );
}
