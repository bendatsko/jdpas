// File: @/services/data/menus.ts

import React from 'react';
import { FileSettings, Home, Plus, Settings2 } from "tabler-icons-react";

interface MenuItem {
    title: string;
    link?: string;
    icon?: JSX.Element;
    children?: MenuItem[];
    isOpen?: boolean;
    requiredRole?: string[];
}

const menus: MenuItem[] = [
    {
        icon: <Home size={18} strokeWidth={2}/>,
        title: "Dashboard",
        link: "/dashboard",
        isOpen: false,
    },
    {
        icon: <Plus size={20} strokeWidth={2}/>,
        title: "Create",
        isOpen: false,
        link: "/create-ldpc",
    },
    {
        icon: <Settings2 size={18} strokeWidth={2}/>,
        title: "Settings",
        link: "/settings",
        isOpen: false,
    },
    {
        icon: <FileSettings size={18} strokeWidth={2}/>,
        title: "Admin",
        link: "/administrator",
        isOpen: false,
        requiredRole: ['Developer'],
    },
];

export default menus;