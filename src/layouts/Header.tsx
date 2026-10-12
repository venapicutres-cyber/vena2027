import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu as MenuIcon, Search as SearchIcon, Bell as BellIcon } from 'lucide-react';
import { ViewType, User, Notification, NavigationAction, Profile } from '../types';
import { LightbulbIcon, ClockIcon, CheckSquareIcon, MessageSquareIcon, DollarSignIcon, UsersIcon, LogOutIcon, WhatsappIcon } from '../constants';

interface HeaderProps {
    pageTitle: ViewType;
    toggleSidebar: () => void;
    setIsSearchOpen: (isOpen: boolean) => void;
    notifications: Notification[];
    handleNavigation: (view: ViewType, action?: NavigationAction, notificationId?: string) => void;
    handleMarkAllAsRead: () => void;
    currentUser: User | null;
    profile: Profile;
    handleLogout: () => void;
}

const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m lalu`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j lalu`;

    const days = Math.floor(hours / 24);
    return `${days}h lalu`;
};

const notificationIcons: { [key in Notification['icon']]: React.ReactNode } = {
    lead: <LightbulbIcon className="w-5 h-5 text-yellow-400" />,
    deadline: <ClockIcon className="w-5 h-5 text-orange-400" />,
    feedback: <WhatsappIcon className="w-5 h-5 text-blue-400" />,
    payment: <DollarSignIcon className="w-5 h-5 text-red-400" />,
    completed: <CheckSquareIcon className="w-5 h-5 text-green-400" />,
    comment: <WhatsappIcon className="w-5 h-5 text-cyan-400" />,
};

const Header: React.FC<HeaderProps> = ({ pageTitle, toggleSidebar, setIsSearchOpen, notifications, handleNavigation, handleMarkAllAsRead, currentUser, profile, handleLogout }) => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Force light mode for stability
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('theme', 'light'); } catch {}
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onNotificationClick = (notification: Notification) => {
        if (notification.link) {
            handleNavigation(notification.link.view, notification.link.action, notification.id);
        }
        setIsNotifOpen(false);
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };


    return (
        <div className="flex-shrink-0">
            <header 
                id="app-header" 
                className="
                    bg-white/90
                    backdrop-blur-md
                    flex items-center justify-between 
                    relative
                    h-16 sm:h-20 
                    px-3 sm:px-4 md:px-6 lg:px-8 
                    border-b border-[#EAEFF4]
                    sticky top-0 z-50
                    shadow-xs
                "
                style={{
                    paddingTop: 'calc(0.75rem + var(--safe-area-inset-top, 0px))',
                    height: 'calc(4rem + var(--safe-area-inset-top, 0px))',
                }}
            >
                {/* Left Section */}
                <div className="flex items-center min-w-0 flex-1">
                    {/* Hamburger Button — mobile/tablet only */}
                    <button
                        onClick={toggleSidebar}
                        className="
                            text-[#5A6A85] 
                            hover:text-[#5D87FF] 
                            active:text-[#5D87FF]
                            p-2 sm:p-2.5 
                            -ml-2 
                            rounded-xl 
                            hover:bg-[#ECF2FF] 
                            active:bg-[#ECF2FF]/80
                            xl:hidden
                            min-w-[44px] min-h-[44px]
                            flex items-center justify-center
                            transition-all duration-200
                            focus:outline-none
                            focus:ring-2 focus:ring-[#5D87FF]/20
                        "
                        aria-label="Toggle sidebar"
                    >
                        <span className="flex flex-col items-center justify-center gap-[4px] w-5 h-5 sm:w-6 sm:h-6">
                            <span className="block h-[2.5px] w-full rounded-full bg-current"></span>
                            <span className="block h-[2.5px] w-full rounded-full bg-current"></span>
                            <span className="block h-[2.5px] w-full rounded-full bg-current"></span>
                        </span>
                    </button>
                    
                    {/* Page Title — hidden on xs, shown sm+ */}
                    <h1 className="
                        page-title-mobile
                        text-base sm:text-lg xl:text-xl 
                        font-extrabold 
                        text-[#2A3547] 
                        ml-2 lg:ml-0
                        truncate
                        select-none
                        max-w-[140px] sm:max-w-none
                        tracking-tight
                    ">
                        {pageTitle}
                    </h1>
                </div>

                {/* Brand Identity — center of header, mobile/tablet only */}
                <div className="header-brand-mobile" aria-hidden="true">
                    {profile?.logoBase64 ? (
                        <img
                            src={profile.logoBase64}
                            alt={profile.companyName || 'Logo'}
                            width="28"
                            height="28"
                            loading="lazy"
                            decoding="async"
                            className="w-7 h-7 rounded-lg object-cover shadow-xs border border-[#EAEFF4]"
                        />
                    ) : (
                        <img
                            src="/assets/images/logos/logoIcon.svg"
                            alt="Logo"
                            width="28"
                            height="28"
                            loading="lazy"
                            decoding="async"
                            className="w-7 h-7 object-contain"
                        />
                    )}
                    <span className="text-sm font-extrabold text-[#2A3547] tracking-tight truncate">
                        {profile?.companyName || 'weddfin'}
                    </span>
                </div>

                {/* Right Section - Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
                    {/* Enhanced Search Button */}
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="
                            p-2 sm:p-2.5
                            text-[#5A6A85] 
                            hover:text-[#5D87FF] 
                            active:text-[#5D87FF]
                            rounded-xl 
                            hover:bg-[#ECF2FF] 
                            active:bg-[#ECF2FF]/80
                            min-w-[44px] min-h-[44px]
                            flex items-center justify-center
                            transition-all duration-200
                            focus:outline-none
                            focus:ring-2 focus:ring-[#5D87FF]/20
                        "
                        aria-label="Buka pencarian global"
                    >
                        <SearchIcon className="w-5 h-5" />
                    </button>

                    {/* Enhanced Notification Button */}
                    <div className="relative" ref={notifRef}>
                        <button 
                            onClick={() => setIsNotifOpen(prev => !prev)}
                            className="
                                relative 
                                p-2 sm:p-2.5
                                text-[#5A6A85] 
                                hover:text-[#5D87FF] 
                                active:text-[#5D87FF]
                                rounded-xl 
                                hover:bg-[#ECF2FF] 
                                active:bg-[#ECF2FF]/80
                                min-w-[44px] min-h-[44px]
                                flex items-center justify-center
                                transition-all duration-200
                                focus:outline-none
                                focus:ring-2 focus:ring-[#5D87FF]/20
                            "
                            aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} baru)` : ''}`}
                        >
                            <BellIcon className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex">
                                    <span className="
                                        animate-ping absolute inline-flex 
                                        h-2.5 w-2.5 
                                        rounded-full 
                                        bg-[#FA896B] 
                                        opacity-75
                                    "></span>
                                    <span className="
                                        relative inline-flex 
                                        rounded-full 
                                        h-2.5 w-2.5 
                                        bg-[#FA896B]
                                        border-2 border-white
                                        shadow-xs
                                    "></span>
                                </span>
                            )}
                        </button>
                        
                        {/* Enhanced Notification Dropdown */}
                        {isNotifOpen && (
                            <div className="
                                absolute top-full right-0 
                                mt-3 
                                w-80 sm:w-96 
                                bg-brand-surface 
                                rounded-2xl 
                                shadow-2xl 
                                border border-brand-border/50 
                                z-[60]
                                animate-slide-down
                                max-h-96
                                flex flex-col
                                overflow-hidden
                            ">
                                {/* Header */}
                                <div className="
                                    flex justify-between items-center 
                                    p-4 sm:p-5 
                                    border-b border-brand-border/50
                                    bg-brand-surface/90
                                    flex-shrink-0
                                ">
                                    <h4 className="font-semibold text-brand-text-light">
                                        Notifikasi
                                    </h4>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkAllAsRead} 
                                            className="
                                                text-xs 
                                                font-semibold 
                                                text-brand-accent 
                                                hover:text-brand-accent-hover
                                                active:text-brand-accent-hover 
                                                px-3 py-1.5
                                                rounded-lg
                                                hover:bg-brand-accent/10
                                                active:bg-brand-accent/20
                                                transition-all duration-200
                                                min-h-[44px]
                                            "
                                        >
                                            Tandai semua dibaca
                                        </button>
                                    )}
                                </div>
                                
                                {/* Notifications List */}
                                <div className="
                                    max-h-80 
                                    overflow-y-auto 
                                    overscroll-contain
                                    flex-1
                                " 
                                style={{ WebkitOverflowScrolling: 'touch' }}>
                                    {notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <div 
                                                key={notif.id}
                                                onClick={() => onNotificationClick(notif)}
                                                className={`
                                                    flex items-start gap-3 sm:gap-4 
                                                    p-3 sm:p-4 
                                                    border-b border-brand-border/30 
                                                    last:border-b-0 
                                                    cursor-pointer 
                                                    transition-all duration-200
                                                    hover:bg-brand-input/50
                                                    active:bg-brand-input/80
                                                    min-h-[60px]
                                                    ${!notif.isRead ? 'bg-blue-500/5 border-l-4 border-l-blue-400' : ''}
                                                `}
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {notificationIcons[notif.icon]}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="
                                                        font-semibold 
                                                        text-sm 
                                                        text-brand-text-light
                                                        leading-tight
                                                        mb-1
                                                    ">
                                                        {notif.title}
                                                    </p>
                                                    <p className="
                                                        text-xs 
                                                        text-brand-text-secondary
                                                        leading-relaxed
                                                        line-clamp-2
                                                    ">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                                <div className="
                                                    flex-shrink-0 
                                                    text-right
                                                    flex flex-col items-end
                                                    gap-1
                                                ">
                                                    <p className="
                                                        text-xs 
                                                        text-brand-text-secondary
                                                        whitespace-nowrap
                                                    ">
                                                        {getRelativeTime(notif.timestamp)}
                                                    </p>
                                                    {!notif.isRead && (
                                                        <div className="
                                                            w-2 h-2 
                                                            bg-brand-accent 
                                                            rounded-full 
                                                            shadow-sm
                                                        "></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="
                                            text-center 
                                            text-sm 
                                            text-brand-text-secondary 
                                            p-8
                                            flex flex-col items-center
                                            gap-3
                                        ">
                                            <BellIcon className="w-8 h-8 opacity-50" />
                                            <p>Tidak ada notifikasi.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button 
                            onClick={() => setIsProfileOpen(prev => !prev)}
                            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full bg-[#ECF2FF] border border-[#5D87FF]/25 flex items-center justify-center overflow-hidden shadow-xs hover:ring-2 hover:ring-[#5D87FF]/30 transition-all cursor-pointer"
                            aria-haspopup="true"
                            aria-expanded={isProfileOpen}
                        >
                            {profile?.logoBase64 ? (
                                <img src={profile.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-extrabold text-xs sm:text-sm text-[#5D87FF]">{getInitials(profile?.fullName || currentUser?.fullName || '')}</span>
                            )}
                        </button>

                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-[#EAEFF4] z-[60] animate-slide-down overflow-hidden">
                                <div className="p-4 bg-[#ECF2FF]/50 border-b border-[#EAEFF4] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5D87FF] to-[#49BEFF] overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
                                        {profile?.logoBase64 ? (
                                            <img src={profile.logoBase64} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            getInitials(profile?.fullName || currentUser?.fullName || '')
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-[#2A3547] truncate">{profile?.fullName || currentUser?.fullName}</p>
                                        <p className="text-xs text-[#5A6A85] truncate mt-0.5">{profile?.email || currentUser?.email}</p>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#FA896B] hover:bg-[#FDEDE8] transition-colors cursor-pointer"
                                    >
                                        <LogOutIcon className="w-4 h-4 text-[#FA896B]" />
                                        <span>Keluar Akun</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <style>{`
                    @keyframes slideDown {
                        from { 
                            opacity: 0; 
                            transform: translateY(-10px) scale(0.95); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0) scale(1); 
                        }
                    }
                    
                    .animate-slide-down { 
                        animation: slideDown 0.2s ease-out forwards; 
                    }
                    
                    /* Text truncation utility */
                    .line-clamp-2 {
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    
                    /* Enhanced scrollbar for notifications */
                    .overflow-y-auto::-webkit-scrollbar {
                        width: 6px;
                    }
                    
                    .overflow-y-auto::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    
                    .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: var(--color-border);
                        border-radius: 3px;
                    }
                    
                    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: var(--color-text-secondary);
                    }
                `}</style>
            </header>
        </div>
    );
};

export default Header;
