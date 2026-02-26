import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';

export interface LocationPricing {
    tax_rate: number;               // e.g. 0.10 = 10%
    delivery_fee: number;           // flat fee e.g. 2.50
    min_order_amount: number;       // minimum before delivery qualifies
    free_delivery_threshold: number;// order total above which delivery is free
    currency: string;               // e.g. 'USD'
}

const PRICING_DEFAULTS: LocationPricing = {
    tax_rate: 0.10,
    delivery_fee: 2.50,
    min_order_amount: 0,
    free_delivery_threshold: 0,
    currency: 'USD',
};

/**
 * AUDIT FIX: Fetches live pricing settings from the API instead of using
 * hardcoded values. The cart store previously had tax_rate = 0.10 and
 * delivery_fee = $2.50 hardcoded — mismatching backend Setting table values.
 *
 * Results are cached for 5 minutes so the cart doesn't make a request on
 * every interaction.
 *
 * @param locationId - The branch/location ID to fetch settings for
 */
export function useLocationSettings(locationId?: number) {
    return useQuery<LocationPricing>({
        queryKey: ['location-pricing', locationId],
        queryFn: async () => {
            const params = locationId ? `?location_id=${locationId}` : '';
            const res = await apiGet<{ data: LocationPricing }>(
                `/public/settings/pricing${params}`
            );
            return res.data;
        },
        staleTime: 1000 * 60 * 5,   // cache for 5 minutes
        placeholderData: PRICING_DEFAULTS,
        enabled: true,
    });
}
