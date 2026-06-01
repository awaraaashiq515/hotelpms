/**
 * Dynamic branded dashboard route: /restaurantadmin/[slug]
 *
 * This lightweight Server Component wraps the original DashboardPage so that:
 *  - Restaurant admins get a professional, branded URL (e.g. /restaurantadmin/kunals-kitchen)
 *  - All existing dashboard logic, components and API calls remain unchanged
 *  - Next.js App Router picks this up automatically without any config changes
 */
import DashboardPage from '../../dashboard/page';

export default function RestaurantAdminDashboard() {
  return <DashboardPage />;
}

// Ensure the page is always rendered fresh (no static generation)
export const dynamic = 'force-dynamic';
