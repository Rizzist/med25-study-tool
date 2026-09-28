import {pageSession} from '@/src/lib/server/auth';
import {AuthBoundary} from '@/src/components/AuthBoundary';
import {AuthForm} from '@/src/components/AuthForm';
export default async function AuthenticatedTemplate({children}:{children:React.ReactNode}){
  const session=await pageSession();
  if(!session)return <AuthForm/>;
  if(session.mustChangePassword)return <AuthForm mode="password" forced/>;
  return <AuthBoundary>{children}</AuthBoundary>;
}
