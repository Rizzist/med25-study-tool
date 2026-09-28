import {redirect} from 'next/navigation';
import {pageSession} from '@/src/lib/server/auth';
import {AuthForm} from '@/src/components/AuthForm';
export const dynamic='force-dynamic';
export default async function Login(){const session=await pageSession();if(session)redirect(session.mustChangePassword?'/change-password':'/');return <AuthForm/>;}
