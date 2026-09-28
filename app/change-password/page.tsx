import {redirect} from 'next/navigation';
import {pageSession} from '@/src/lib/server/auth';
import {AuthForm} from '@/src/components/AuthForm';
export const dynamic='force-dynamic';
export default async function ChangePassword(){const session=await pageSession();if(!session)redirect('/login');return <AuthForm mode="password" forced={session.mustChangePassword}/>;}
