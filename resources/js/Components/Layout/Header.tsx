import Notifications from './Header/Notifications';
import UserMenu from './Header/UserMenu';

export default function Header() {
  const toggleDark = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <button onClick={toggleDark} className="px-3 py-1 text-sm border rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700">Theme</button>
      </div>
      <div className="flex items-center space-x-4">
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
