import { useState } from 'react';
import { Menu, Search, Bell, User, X } from 'lucide-react';
import Notifications from './Header/Notifications';
import UserMenu from './Header/UserMenu';

type HeaderProps = {
  onMenuClick?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
};

export default function Header({ onMenuClick, showSearch = true, onSearch }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDark = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search - Desktop always visible, Mobile toggle */}
        {showSearch && (
          <>
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Search input */}
            <form onSubmit={handleSearch} className={`${searchOpen ? 'flex' : 'hidden lg:flex'} flex-1 max-w-md items-center`}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      if (onSearch) onSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Search button - Desktop */}
        {showSearch && (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
