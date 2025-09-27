<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index() { return response()->json(['message' => 'Not implemented']); }
    public function store(Request $request) { return response()->json(['message' => 'Not implemented']); }
    public function show($id) { return response()->json(['message' => 'Not implemented']); }
    public function update(Request $request, $id) { return response()->json(['message' => 'Not implemented']); }
    public function destroy($id) { return response()->json(['message' => 'Not implemented']); }
}
