import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconName } from "@/components/icons/Icon";

export type RouteKey = "dashboard" | "users" | "prescriptions" | "drugs" | "interactions" | "ocr";
export type NavGroup = "general" | "core" | "ocr";

export interface RouteDef {
    key: RouteKey;
    label: string;
    title: string;
    subtitle: string;
    icon: IconName;
    group: NavGroup;
    component: LazyExoticComponent<ComponentType>;
}

export const NAV_GROUP_LABEL: Record<NavGroup, string> = {
    general: "Umumiy",
    core: "Core xizmati",
    ocr: "OCR xizmati"
};

// Har bir sahifa alohida chunk sifatida faqat ochilganda yuklanadi
export const ROUTES: RouteDef[] = [
    {
        key: "dashboard",
        label: "Boshqaruv paneli",
        title: "Boshqaruv paneli",
        subtitle: "Tizimning umumiy holati va dinamikasi",
        icon: "dashboard",
        group: "general",
        component: lazy(() => import("@/pages/dashboard/DashboardPage"))
    },
    {
        key: "users",
        label: "Foydalanuvchilar",
        title: "Foydalanuvchilar",
        subtitle: "Bemorlar, shifokorlar va administratorlar",
        icon: "users",
        group: "core",
        component: lazy(() => import("@/pages/users/UsersPage"))
    },
    {
        key: "prescriptions",
        label: "Retseptlar",
        title: "Retseptlar",
        subtitle: "OCR va DMED orqali kelgan barcha retseptlar",
        icon: "file",
        group: "core",
        component: lazy(() => import("@/pages/prescriptions/PrescriptionsPage"))
    },
    {
        key: "drugs",
        label: "Dorilar",
        title: "Dorilar katalogi",
        subtitle: "Narx, qoldiq va mavjudlik",
        icon: "pill",
        group: "core",
        component: lazy(() => import("@/pages/drugs/DrugsPage"))
    },
    {
        key: "interactions",
        label: "O'zaro ta'sir",
        title: "Dorilarning o'zaro ta'siri",
        subtitle: "Xavfli kombinatsiyalar bazasi",
        icon: "zap",
        group: "core",
        component: lazy(() => import("@/pages/interactions/InteractionsPage"))
    },
    {
        key: "ocr",
        label: "OCR laboratoriya",
        title: "OCR laboratoriya",
        subtitle: "Retsept rasmini tanib, natijani tekshirish",
        icon: "scan",
        group: "ocr",
        component: lazy(() => import("@/pages/ocr/OcrLabPage"))
    }
];

export const DEFAULT_ROUTE: RouteKey = "dashboard";
