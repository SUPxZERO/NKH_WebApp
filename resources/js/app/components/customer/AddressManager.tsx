import React from 'react';
import { useCustomerAddresses } from '@/app/hooks/useCustomer';
import { CustomerAddress } from '@/app/types/domain';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';

interface Props {
  selected?: CustomerAddress | null;
  onSelect: (addr?: CustomerAddress | null) => void;
}

export default function AddressManager({ selected, onSelect }: Props) {
  const { data: addresses, isLoading } = useCustomerAddresses();

  return (
    <Card>
      <CardHeader>
        <div className="font-semibold">Delivery Address</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-2">
            {(addresses || []).map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect(a)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${selected?.id === a.id ? 'border-fuchsia-400 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="font-medium">{a.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{a.line1}</div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 text-xs text-gray-500">Map integration coming soon.</div>
      </CardContent>
    </Card>
  );
}
