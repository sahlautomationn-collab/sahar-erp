'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // القائمة ثابتة باللغة الإنجليزية
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: 'fa-chart-pie' },
    { name: 'Best Sellers', path: '/admin/best-sellers', icon: 'fa-trophy' },
    { name: 'POS', path: '/admin/pos', icon: 'fa-cash-register' },
    { name: 'Orders', path: '/admin/orders', icon: 'fa-receipt' },
    { name: 'Kitchen', path: '/admin/kitchen', icon: 'fa-fire-burner' },
    { name: 'Finance', path: '/admin/finance', icon: 'fa-coins' },
    { name: 'Inventory', path: '/admin/inventory', icon: 'fa-boxes-stacked' },
    { name: 'Stock Log', path: '/admin/inventory-log', icon: 'fa-clipboard-list' },
    { name: 'Menu', path: '/admin/menu', icon: 'fa-book-open' },
    { name: 'Recipes', path: '/admin/recipes', icon: 'fa-scroll' },
    { name: 'Suppliers', path: '/admin/suppliers', icon: 'fa-truck' },
    { name: 'Customers', path: '/admin/customers', icon: 'fa-users' },
  ];

  return (
    <div 
      className={`fixed top-0 left-0 h-screen bg-[#1E1E1E] border-r border-[#333] z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl
      ${isHovered ? 'w-64' : 'w-20'}`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center border-b border-[#333] overflow-hidden whitespace-nowrap">
        {isHovered ? (
          <h1 className="text-2xl font-black text-white tracking-wider animate-fade-in">
            SAHAR <span className="text-[#B69142]">ERP</span>
          </h1>
        ) : (
          <h1 className="text-2xl font-black text-[#B69142]">S</h1>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar overflow-x-hidden">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative
                    ${isActive 
                      ? 'bg-[#B69142] text-black font-bold shadow-[0_0_15px_rgba(182,145,66,0.4)]' 
                      : 'text-gray-400 hover:bg-[#252525] hover:text-white'
                    } ${!isHovered && 'justify-center'} `}
                >
                  {/* Icon */}
                  <i className={`fas ${item.icon} text-xl transition-transform duration-300 group-hover:scale-110 
                    ${isActive ? 'text-black' : 'text-[#B69142]'} min-w-[24px] text-center`}></i>
                  
                  {/* Text */}
                  <span className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300
                    ${isHovered 
                        ? 'w-auto opacity-100 translate-x-0' 
                        : 'w-0 opacity-0 absolute -translate-x-4'
                    }`}>
                    {item.name}
                  </span>

                  {/* Tooltip (Fixed Position) */}
                  {!isHovered && (
                    <div className="absolute left-14 top-2 bg-[#333] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-[#B69142]">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-[#333] overflow-hidden flex flex-col gap-2">
        
        {/* User Card */}
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl bg-[#121212] border border-[#333] transition-all duration-300
          ${!isHovered && 'justify-center border-none bg-transparent'}`}>
            
            <div className="w-8 h-8 rounded-full bg-[#B69142] flex items-center justify-center text-black font-bold text-xs shrink-0">
              A
            </div>
            
            <div className={`flex-1 transition-all duration-300 overflow-hidden ${isHovered ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
                <p className="text-xs text-white font-bold truncate">Admin User</p>
                <p className="text-[10px] text-green-500 truncate">Online</p>
            </div>
            
            <button className={`text-gray-500 hover:text-red-500 transition-colors ${!isHovered && 'hidden'}`}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
        </div>

      </div>
    </div>
  );
}