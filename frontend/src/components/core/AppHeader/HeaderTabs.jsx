"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiEdit3, FiPackage, FiPlusSquare, FiSettings } from "react-icons/fi";

const TABS = [
  { href: "/used-stock", label: "Used Stock", icon: FiPackage },
  { href: "/edit-data", label: "Edit Data", icon: FiEdit3 },
  { href: "/create-data", label: "Create Data", icon: FiPlusSquare },
  { href: "/config", label: "Config", icon: FiSettings },
];

const HeaderTabs = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu utama" className="-mb-1 flex gap-1 overflow-x-auto">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 border-b-4 px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "border-white text-white"
                : "border-transparent text-white/60 hover:border-white/30 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderTabs;
