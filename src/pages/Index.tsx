import { useApp } from '@/lib/context';
import OwnerSetup from '@/components/auth/OwnerSetup';
import AuthPage from '@/components/auth/AuthPage';
import Sidebar from '@/components/layout/Sidebar';
import DashboardPage from '@/components/dashboard/DashboardPage';
import SitesPage from '@/components/sites/SitesPage';
import PathsPage from '@/components/paths/PathsPage';
import MembersPage from '@/components/members/MembersPage';
import AchievementsPage from '@/components/achievements/AchievementsPage';
import CabinetPage from '@/components/cabinet/CabinetPage';
import MessagesPage from '@/components/messages/MessagesPage';

export default function Index() {
  const { currentUser, hasOwnerAccount, activePage } = useApp();

  if (!hasOwnerAccount) {
    return <OwnerSetup />;
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'sites': return <SitesPage />;
      case 'paths': return <PathsPage />;
      case 'members': return <MembersPage />;
      case 'achievements': return <AchievementsPage />;
      case 'messages': return <MessagesPage />;
      case 'cabinet': return <CabinetPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        {renderPage()}
      </main>
    </div>
  );
}
