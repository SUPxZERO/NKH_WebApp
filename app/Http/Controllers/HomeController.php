<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Feedback;
use App\Models\Customer;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\FeedbackResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    /**
     * Display the homepage with all necessary data
     */
    public function index(): Response
    {
        // Cache homepage data for 5 minutes to improve performance
        $homeData = Cache::remember('homepage_data', 300, function () {
            return [
                'featuredItems' => $this->getFeaturedItems(),
                'categories' => $this->getCategoriesWithCounts(),
                'testimonials' => $this->getTestimonials(),
                'stats' => $this->getStats(),
            ];
        });

        return Inertia::render('Customer/Home', $homeData);
    }

    /**
     * Get featured menu items using MenuItemResource
     */
    private function getFeaturedItems(): array
    {
        $items = MenuItem::query()
            ->where('is_active', true)
            ->where('is_featured', true)
            ->orderBy('featured_order')
            ->limit(3)
            ->get();

        return MenuItemResource::collection($items)->resolve();
    }

    /**
     * Get categories with item counts
     */
    private function getCategoriesWithCounts(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->whereNot('parent_id', null)
            ->withCount(['menuItems as count' => function ($query) {
                $query->where('is_active', true);
            }])
            ->orderBy('display_order')
            ->limit(6)
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $this->getCategoryIcon($category->name),
                    'count' => $category->count ?? 0,
                    'color' => $this->getCategoryColor($category->name),    
                ];
            })
            ->toArray();
    }

    /**
     * Get latest testimonials from Feedback table
     */
    private function getTestimonials(): array
    {
        // Try to get real testimonials from Feedback
        $feedbacks = Feedback::query()
            ->with(['customer.user'])
            ->where('visibility', 'public')
            ->where('rating', '>=', 4)
            ->latest()
            ->limit(3)
            ->get();

        // If we have feedback, use it
        if ($feedbacks->isNotEmpty()) {
            return FeedbackResource::collection($feedbacks)->resolve();
        }

        // Otherwise, return demo data
        return [
            [
                'id' => 1,
                'customer_name' => 'Sarah Johnson',
                'customer_role' => 'Regular Customer',
                'content' => 'Best food delivery experience! The quality is consistently amazing and delivery is always on time. The gourmet burger is my absolute favorite!',
                'rating' => 5,
                'avatar' => '👩',
            ],
            [
                'id' => 2,
                'customer_name' => 'Michael Chen',
                'customer_role' => 'Food Enthusiast',
                'content' => 'I\'ve tried many restaurants, but NKH stands out. Fresh ingredients, creative recipes, and excellent customer service. Highly recommended!',
                'rating' => 5,
                'avatar' => '👨',
            ],
            [
                'id' => 3,
                'customer_name' => 'Emily Rodriguez',
                'customer_role' => 'Happy Customer',
                'content' => 'The pasta carbonara is authentic and delicious! Love the easy ordering process and the food always arrives hot and fresh.',
                'rating' => 5,
                'avatar' => '👩‍🦱',
            ],
        ];
    }

    /**
     * Get homepage statistics
     */
    private function getStats(): array
    {
        // Calculate real statistics
        $totalMenuItems = MenuItem::where('is_active', true)->count();
        $averageRating = MenuItem::where('is_active', true)
            ->whereNotNull('rating')
            ->avg('rating');
        $totalCustomers = Customer::count();

        return [
            'totalItems' => $totalMenuItems,
            'averageRating' => $averageRating ? round($averageRating, 1) : 4.9,
            'totalCustomers' => $totalCustomers > 0 ? $totalCustomers : 10000,
            'averageDeliveryTime' => 30, // TODO: Calculate from order completion times
        ];
    }

    /**
     * Get icon emoji for category
     */
    private function getCategoryIcon(string $categoryName): string
    {
        $icons = [
            'Burgers' => '🍔',
            'Pizza' => '🍕',
            'Pasta' => '🍝',
            'Desserts' => '🍰',
            'Dessert' => '🍰',
            'Beverages' => '🥤',
            'Beverage' => '🥤',
            'Drinks' => '🥤',
            'Salads' => '🥗',
            'Salad' => '🥗',
            'Appetizers' => '🍟',
            'Appetizer' => '🍟',
            'Main Course' => '🍽️',
            'Seafood' => '🐟',
            'Chicken' => '🍗',
            'Vegetarian' => '🥬',
        ];

        return $icons[$categoryName] ?? '🍽️';
    }

    /**
     * Get color gradient for category
     */
    private function getCategoryColor(string $categoryName): string
    {
        $colors = [
            'Burgers' => 'from-orange-500 to-red-500',
            'Pizza' => 'from-yellow-500 to-orange-500',
            'Pasta' => 'from-pink-500 to-rose-500',
            'Desserts' => 'from-purple-500 to-pink-500',
            'Dessert' => 'from-purple-500 to-pink-500',
            'Beverages' => 'from-blue-500 to-cyan-500',
            'Beverage' => 'from-blue-500 to-cyan-500',
            'Drinks' => 'from-blue-500 to-cyan-500',
            'Salads' => 'from-green-500 to-emerald-500',
            'Salad' => 'from-green-500 to-emerald-500',
        ];

        return $colors[$categoryName] ?? 'from-gray-500 to-slate-500';
    }
}
