<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->per_page ?? 10);
            
        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high,critical',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Support ticket created successfully',
            'ticket' => $ticket
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $ticket = SupportTicket::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($ticket);
    }
}
