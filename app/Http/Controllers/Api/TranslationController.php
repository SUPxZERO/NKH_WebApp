<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\CategoryTranslation;
use App\Models\MenuItemTranslation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TranslationController extends Controller
{
    /**
     * Get all category translations
     */
    public function getCategoryTranslations(): JsonResponse
    {
        $categories = Category::with([
            'translations' => function ($query) {
                $query->whereIn('locale', ['en', 'km']);
            }
        ])->get();

        $data = $categories->map(function ($category) {
            $translations = $category->translations->groupBy('locale');
            return [
                'id' => $category->id,
                'translations' => [
                    'en' => $translations->get('en')?->first(),
                    'km' => $translations->get('km')?->first(),
                ]
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Get all menu item translations
     */
    public function getMenuItemTranslations(): JsonResponse
    {
        $menuItems = MenuItem::with([
            'translations' => function ($query) {
                $query->whereIn('locale', ['en', 'km']);
            },
            'category.translations'
        ])->get();

        $data = $menuItems->map(function ($item) {
            $translations = $item->translations->groupBy('locale');
            return [
                'id' => $item->id,
                'category' => $item->category?->translations->where('locale', 'en')->first()?->name ?? 'N/A',
                'translations' => [
                    'en' => $translations->get('en')?->first(),
                    'km' => $translations->get('km')?->first(),
                ]
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Update category translation
     */
    public function updateCategoryTranslation(Request $request, $categoryId): JsonResponse
    {
        $request->validate([
            'locale' => 'required|in:en,km',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            CategoryTranslation::updateOrCreate(
                [
                    'category_id' => $categoryId,
                    'locale' => $request->locale,
                ],
                [
                    'name' => $request->name,
                    'description' => $request->description,
                ]
            );

            DB::commit();
            return response()->json(['message' => __('messages.api.utility.translation_updated')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('messages.api.utility.translation_update_failed', ['error' => $e->getMessage()])], 500);
        }
    }

    /**
     * Update menu item translation
     */
    public function updateMenuItemTranslation(Request $request, $menuItemId): JsonResponse
    {
        $request->validate([
            'locale' => 'required|in:en,km',
            'name' => 'required|string|max:120',
            'description' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            MenuItemTranslation::updateOrCreate(
                [
                    'menu_item_id' => $menuItemId,
                    'locale' => $request->locale,
                ],
                [
                    'name' => $request->name,
                    'description' => $request->description,
                ]
            );

            DB::commit();
            return response()->json(['message' => __('messages.api.utility.translation_updated')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('messages.api.utility.translation_update_failed', ['error' => $e->getMessage()])], 500);
        }
    }

    /**
     * Bulk update translations
     */
    public function bulkUpdateTranslations(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:category,menu_item',
            'translations' => 'required|array',
            'translations.*.id' => 'required|integer',
            'translations.*.locale' => 'required|in:en,km',
            'translations.*.name' => 'required|string',
            'translations.*.description' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->translations as $translation) {
                if ($request->type === 'category') {
                    CategoryTranslation::updateOrCreate(
                        [
                            'category_id' => $translation['id'],
                            'locale' => $translation['locale'],
                        ],
                        [
                            'name' => $translation['name'],
                            'description' => $translation['description'] ?? null,
                        ]
                    );
                } else {
                    MenuItemTranslation::updateOrCreate(
                        [
                            'menu_item_id' => $translation['id'],
                            'locale' => $translation['locale'],
                        ],
                        [
                            'name' => $translation['name'],
                            'description' => $translation['description'] ?? null,
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json(['message' => __('messages.api.utility.translations_bulk_updated')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => __('messages.api.utility.translations_bulk_failed', ['error' => $e->getMessage()])], 500);
        }
    }

    /**
     * Get missing translations count
     */
    public function getMissingTranslations(): JsonResponse
    {
        $missingCategories = Category::whereDoesntHave('translations', function ($query) {
            $query->where('locale', 'km');
        })->count();

        $missingMenuItems = MenuItem::whereDoesntHave('translations', function ($query) {
            $query->where('locale', 'km');
        })->count();

        return response()->json([
            'data' => [
                'categories' => $missingCategories,
                'menu_items' => $missingMenuItems,
                'total' => $missingCategories + $missingMenuItems,
            ]
        ]);
    }
}
