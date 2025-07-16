import { decodeId } from "@/utils/hashids";
import { notFound } from "next/navigation";
import prisma from "@/utils/db";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import { UserDetailBandwidthToday } from "@/components/common/UserDetailBandwidthToday";
import StatisticsChart from "@/components/common/StatisticCharts";
import UserTrafficBarChart from "@/components/common/UserTrafficBarChart";
import TableCurrentOnline from "@/components/common/TableCurrentOnline";
import { UserAvatar } from "@/components/common/UserAvatar";
import { UserDetailTotalTraffic } from "@/components/common/UserDetailTotalTraffic";
import UserTableUsage from "@/components/common/UserTableUsage";

export async function generateMetadata({ params }: { params: Promise<{ hashed_user_id: string }> }): Promise<Metadata> {
  const { hashed_user_id } = await params;
  const userId = decodeId(hashed_user_id);
  if (!userId) {
    notFound();
  }

  const user: { username: string } | null = await prisma.users.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    notFound();
  }

  const usernameNice = String(user.username).charAt(0).toUpperCase() + String(user.username).slice(1);

  return {
    title: `Mikrotik IP Accounting Monitor - User Detail: ${usernameNice}`,
    description: `Detailed information about user ${usernameNice}.`,
  };
}

export default async function UserPage({ params }: { params: Promise<{ hashed_user_id: string }> }) {
  const { hashed_user_id } = await params;
  const userId = decodeId(hashed_user_id);
  if (!userId) {
    notFound();
  }

  const user: { username: string } | null = await prisma.users.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    notFound();
  }

  const usernameNice = String(user.username).charAt(0).toUpperCase() + String(user.username).slice(1);

  return (
    <div>
      <PageBreadcrumb
        pageTitle={`User Detail: ${usernameNice}`}
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: "/user-monitoring", label: "User Monitoring" },
        ]} />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-2 col-span-6 self-stretch">
              <UserAvatar username={usernameNice} HrefUrl={`/user-monitoring/${hashed_user_id}`} />
            </div>
            <div className="md:col-span-4 col-span-6 self-stretch">
              <UserDetailTotalTraffic user_id={userId} />
            </div>
            <div className="md:col-span-6 col-span-12 self-stretch">
              <UserDetailBandwidthToday user_id={userId} />
            </div>
            <div className="col-span-12">
              <StatisticsChart user_id={userId} />
            </div>
            <div className="col-span-12">
              <UserTrafficBarChart user_id={userId} />
            </div>
            <div className="col-span-12">
              <UserTableUsage user_id={userId} />
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
