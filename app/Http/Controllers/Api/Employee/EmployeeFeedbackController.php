<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\EmployeeFeedback;
use Illuminate\Http\Request;

class EmployeeFeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:general,suggestion,complaint,shift_rating',
            'comment' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'is_anonymous' => 'boolean',
            'shift_id' => 'nullable|exists:shifts,id',
        ]);

        $feedback = EmployeeFeedback::create([
            'user_id' => $validated['is_anonymous'] ? null : $request->user()->id,
            'shift_id' => $validated['shift_id'] ?? null,
            'type' => $validated['type'],
            'rating' => $validated['rating'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'is_anonymous' => $validated['is_anonymous'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback
        ], 201);
    }
}
