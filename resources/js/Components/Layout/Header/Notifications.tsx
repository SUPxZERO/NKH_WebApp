export default function Notifications() {
  return (
    <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
      <span role="img" aria-label="bell">🔔</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
    </button>
  );
}
