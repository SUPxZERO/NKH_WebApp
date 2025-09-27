export default function CategoryTabs() {
  const cats = ['All', 'Popular', 'Mains', 'Drinks', 'Desserts'];
  return (
    <div className="flex space-x-2">
      {cats.map((c) => (
        <button key={c} className="px-3 py-1 rounded-sm border hover:bg-gray-50 dark:hover:bg-gray-800">
          {c}
        </button>
      ))}
    </div>
  );
}
