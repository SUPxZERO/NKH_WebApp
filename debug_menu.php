<?php
use Illuminate\Http\Request;
use App\Http\Controllers\Api\MenuItemController;

// Create a mock request
$request = Request::create('/api/menu', 'GET');

// Resolve the controller
$controller = app(MenuItemController::class);

// Execute the index method
$response = $controller->index($request);

// Output the content
echo $response->getContent();
