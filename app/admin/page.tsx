import {redirect} from 'next/navigation';
import {requirePageSession} from '@/src/lib/server/auth';
import {AdminDashboard} from '@/src/components/AdminDashboard';

export const dynamic='force-dynamic';
export default async function AdminPage(){
  const session=await requirePageSession();if(!session.canAccessAdmin)redirect('/');
  return <AdminDashboard/>;
}
