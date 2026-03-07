<?php

namespace App\Http\Middleware;

use App\Services\BranchSessionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * BranchScopeMiddleware
 * 
 * Sets the active branch context for the current request.
 * - Super-admin/admin: reads branch_id from request or session, allows any
 * - Other roles: forces scope to their assigned location(s)
 * 
 * The active branch ID is stored in request attributes for controllers to read.
 */
class BranchScopeMiddleware
{
    public function __construct(
        private BranchSessionService $branchService
    ) {
    }

    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Check if a branch_id is being explicitly requested
        $requestedBranchId = $request->query('branch_id')
            ?? $request->header('X-Branch-Id')
            ?? null;

        if ($requestedBranchId !== null) {
            $requestedBranchId = (int) $requestedBranchId;

            // Validate access
            if (!$user->canAccessBranch($requestedBranchId)) {
                throw new HttpException(403, 'Forbidden: no access to this branch.');
            }

            // Store in session for persistence
            $this->branchService->setActiveBranch($requestedBranchId, $user);
        }

        // Get the effective active branch
        $activeBranchId = $user->getActiveBranchId();

        // Store in request attributes for controllers to use
        $request->attributes->set('active_branch_id', $activeBranchId);
        $request->attributes->set('can_view_all_branches', $user->canViewAllBranches());

        return $next($request);
    }
}
