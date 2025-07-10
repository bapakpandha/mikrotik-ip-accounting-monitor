import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TableUsers from "@/components/common/TableUsers";

export const metadata: Metadata = {
  title:
    "Mikrotik IP Accounting Monitor - User Monitoring",
  description: "Mikrotik IP Accounting Monitor for Monitoring traffic and Online Users",
};

export default function UserMonitoring() {
  return (
    <div>
      <PageBreadcrumb pageTitle="User Monitoring" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <TableUsers />
        </div>
      </div>
    </div>
  );
}
