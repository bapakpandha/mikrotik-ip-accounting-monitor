import Link from "next/link";
import React from "react";

// USAGE EXAMPLE :
{/* <PageBreadcrumb
  pageTitle="Admin"
  breadcrumbs={[
    { href: "/", label: "Home" },
    { href: "/user-monitoring", label: "User Monitoring" },
  ]}
/> */}

interface BreadcrumbItem {
  href: string; // URL untuk navigasi
  label: string; // Label untuk breadcrumb
}

interface BreadcrumbProps {
  pageTitle: string; // Judul halaman
  breadcrumbs: BreadcrumbItem[]; // Array breadcrumb
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, breadcrumbs }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {pageTitle}
      </h2>
      <nav>
        <ol className="hidden md:flex items-center gap-1.5">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={index} className="flex items-center">
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                href={breadcrumb.href}
              >
                {breadcrumb.label}
                {index < breadcrumbs.length && (
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Link>
            </li>
          ))}
          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;