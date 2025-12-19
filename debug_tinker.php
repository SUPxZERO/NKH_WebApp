$user = App\Models\User::first();
if ($user) {
    echo "User found: " . $user->id . "\n";
    try {
        $n = $user->notifications()->create([
            'id' => Illuminate\Support\Str::uuid()->toString(),
            'type' => 'SystemNotification',
            'data' => ['title' => 'Test', 'message' => 'test'],
            'read_at' => null,
        ]);
        echo "Created notification: " . $n->id . "\n";
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "No user found.\n";
}
echo "Total Count: " . Illuminate\Notifications\DatabaseNotification::count() . "\n";
