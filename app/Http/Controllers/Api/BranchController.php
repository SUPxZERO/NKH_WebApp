<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BranchSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * BranchController
 * 
 * Handles branch switching and listing for the admin panel.
 * Super-admin/admin can switch to any branch or view all.
 * Other roles see only their assigned branches.
 */
class BranchController extends Controller
{
    public function __construct(
        private BranchSessionService $branchService
    ) {
    }

    /**
     * GET /api/admin/branches
     * Returns the user's accessible branches.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $branches = $this->branchService->getUserBranches($user);

        return response()->json([
            'branches' => $branches,
            'active_branch_id' => $user->getActiveBranchId(),
            'can_switch_branch' => $user->canViewAllBranches(),
        ]);
    }

    /**
     * POST /api/admin/branch/switch
     * Switches the active branch in the session.
     * Body: { branch_id: int|null }
     */
    public function switch(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => 'nullable|integer|exists:locations,id',
        ]);

        $user = $request->user();
        $branchId = $request->input('branch_id');

        $success = $this->branchService->setActiveBranch($branchId, $user);

        if (!$success) {
            return response()->json([
                'message' => 'You do not have access to this branch.',
            ], 403);
        }

        return response()->json([
            'message' => 'Branch switched successfully.',
            'active_branch_id' => $branchId,
        ]);
    }
}
