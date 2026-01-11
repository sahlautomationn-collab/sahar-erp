'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/auth';
import { toast } from '../lib/toast';

export default function Sidebar({ activeView, role, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('User');

  // Get username from localStorage
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem('username') || role || 'User';
      setUsername(storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1));
    } catch (error) {
      setUsername(role === 'admin' ? 'Admin' : 'User');
    }
  }, [role]);

  // Logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local storage auth data
      auth.logout();

      toast.success('Logged out successfully!');

      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error) {
      console.error('Error logging out:', error.message);
      toast.error('Failed to logout. Please try again.');
    }
  };

  // Filter menu items based on role
  const getAllMenuItems = () => [
    { name: 'Dashboard', path: '/admin', icon: 'fa-chart-pie', roles: ['admin', 'manager'] },
    { name: 'Best Sellers', path: '/admin/best-sellers', icon: 'fa-trophy', roles: ['admin', 'manager'] },
    { name: 'POS', path: '/admin/pos', icon: 'fa-cash-register', roles: ['admin', 'manager', 'user'] },
    { name: 'Orders', path: '/admin/orders', icon: 'fa-receipt', roles: ['admin', 'manager', 'user'] },
    { name: 'Website Orders', path: '/admin/web-orders', icon: 'fa-globe', roles: ['admin', 'manager', 'user'] },
    { name: 'Kitchen', path: '/admin/kitchen', icon: 'fa-fire-burner', roles: ['admin', 'manager', 'user'] },
    { name: 'Finance', path: '/admin/finance', icon: 'fa-coins', roles: ['admin', 'manager'] },
    { name: 'Inventory', path: '/admin/inventory', icon: 'fa-boxes-stacked', roles: ['admin', 'manager'] },
    { name: 'Inventory Log', path: '/admin/inventory-log', icon: 'fa-clipboard-list', roles: ['admin', 'manager'] },
    { name: 'Stock Log', path: '/admin/stock-log', icon: 'fa-chart-bar', roles: ['admin', 'manager'] },
    { name: 'Menu', path: '/admin/menu', icon: 'fa-book-open', roles: ['admin', 'manager'] },
    { name: 'Recipes', path: '/admin/recipes', icon: 'fa-scroll', roles: ['admin', 'manager'] },
    { name: 'Suppliers', path: '/admin/suppliers', icon: 'fa-truck', roles: ['admin', 'manager'] },
    { name: 'Customers', path: '/admin/customers', icon: 'fa-users', roles: ['admin', 'manager'] },
  ];

  const menuItems = getAllMenuItems().filter(item =>
    !item.roles || item.roles.includes(role)
  );

  return (
    <div className="w-full h-full flex flex-col">

      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center border-b border-[#333]">
        <h1 className="text-2xl font-black text-white tracking-wider">
          SAHAR <span className="text-[#B69142]">ERP</span>
        </h1>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group
                    ${isActive
                      ? 'bg-[#B69142] text-black font-bold shadow-[0_0_15px_rgba(182,145,66,0.4)]'
                      : 'text-gray-400 hover:bg-[#252525] hover:text-white'
                    }`}
                >
                  <i className={`fas ${item.icon} text-xl transition-transform duration-300 group-hover:scale-110
                    ${isActive ? 'text-black' : 'text-[#B69142]'} min-w-[24px] text-center`}></i>

                  <span className="text-sm tracking-wide whitespace-nowrap">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-[#333]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[#121212] border border-[#333]">

          <div className="w-8 h-8 rounded-full bg-[#B69142] flex items-center justify-center text-black font-bold text-xs shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-white font-bold truncate">{username}</p>
            <p className="text-[10px] text-green-500 truncate">{role === 'admin' ? 'Admin' : 'User'} • Online</p>
          </div>

          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 transition-colors p-2"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
