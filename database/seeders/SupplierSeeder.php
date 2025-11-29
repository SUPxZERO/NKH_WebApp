<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::truncate();

        $suppliers = [
            [
                'name' => 'Phnom Penh Produce Co.',
                'code' => 'SUP-001',
                'contact_name' => 'Sokha Chen',
                'contact_phone' => '+855-12-345-678',
                'email' => 'orders@phnompenhproduce.com',
                'address' => '123 Norodom Blvd, Phnom Penh',
                'type' => 'produce',
                'payment_terms' => 'net_30',
                'notes' => 'Local fresh produce supplier'
            ],
            [
                'name' => 'Mekong Seafood Supply',
                'code' => 'SUP-002',
                'contact_name' => 'Dara Meas',
                'contact_phone' => '+855-12-456-789',
                'email' => 'sales@mekongseafood.com',
                'address' => '456 Sisowath Quay, Phnom Penh',
                'type' => 'seafood',
                'payment_terms' => 'net_15',
                'notes' => 'Fresh seafood daily delivery'
            ],
            [
                'name' => 'Kampot Spice Traders',
                'code' => 'SUP-003',
                'contact_name' => 'Kunthea Pich',
                'contact_phone' => '+855-12-567-890',
                'email' => 'info@kampotspices.com',
                'address' => '789 Street 13, Kampot',
                'type' => 'spices',
                'payment_terms' => 'net_30',
                'notes' => 'Premium Kampot pepper and spices'
            ],
            [
                'name' => 'Asian Food Solutions',
                'code' => 'SUP-004',
                'contact_name' => 'Sovann Kim',
                'contact_phone' => '+855-12-678-901',
                'email' => 'orders@asianfoodsolutions.com',
                'address' => '101 Street 271, Phnom Penh',
                'type' => 'dry_goods',
                'payment_terms' => 'net_45',
                'notes' => 'Bulk dry goods supplier'
            ],
            [
                'name' => 'Battambang Rice Co.',
                'code' => 'SUP-005',
                'contact_name' => 'Chanthy Roth',
                'contact_phone' => '+855-12-789-012',
                'email' => 'sales@battambangrice.com',
                'address' => '202 National Road 5, Battambang',
                'type' => 'rice',
                'payment_terms' => 'net_30',
                'notes' => 'Premium jasmine rice supplier'
            ],
            [
                'name' => 'Siem Reap Organic Farms',
                'code' => 'SUP-006',
                'contact_name' => 'Bopha Prak',
                'contact_phone' => '+855-12-890-123',
                'email' => 'contact@srorganics.com',
                'address' => '303 Charles de Gaulle, Siem Reap',
                'type' => 'produce',
                'payment_terms' => 'net_15',
                'notes' => 'Organic vegetables and herbs'
            ],
            [
                'name' => 'Cambodia Beverage Co.',
                'code' => 'SUP-007',
                'contact_name' => 'Vibol Tep',
                'contact_phone' => '+855-12-901-234',
                'email' => 'orders@cambev.com',
                'address' => '404 Mao Tse Toung Blvd, Phnom Penh',
                'type' => 'beverages',
                'payment_terms' => 'net_30',
                'notes' => 'Beverages and drink supplies'
            ],
            [
                'name' => 'Kandal Poultry Farms',
                'code' => 'SUP-008',
                'contact_name' => 'Sophal Nget',
                'contact_phone' => '+855-12-012-345',
                'email' => 'orders@kandalpoultry.com',
                'address' => '505 National Road 4, Kandal',
                'type' => 'poultry',
                'payment_terms' => 'cod',
                'notes' => 'Fresh chicken and eggs'
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create([
                'name' => $supplier['name'],
                'code' => $supplier['code'],
                'contact_name' => $supplier['contact_name'],
                'contact_phone' => $supplier['contact_phone'],
                'email' => $supplier['email'],
                'address' => $supplier['address'],
                'type' => $supplier['type'],
                'payment_terms' => $supplier['payment_terms'],
                'notes' => $supplier['notes'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}