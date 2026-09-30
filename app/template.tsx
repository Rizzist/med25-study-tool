import {pageSession} from '@/src/lib/server/auth';
import {AuthBoundary} from '@/src/components/AuthBoundary';
import {AuthForm} from '@/src/components/AuthForm';
export default async function AuthenticatedTemplate({children}:{children:React.ReactNode}){
  const session=await pageSession();
  if(!session)return <AuthForm/>;
  if(session.mustChangePassword)return <AuthForm mode="password" forced displayName={session.displayName}/>;
  return <AuthBoundary initialSession={{displayName:session.displayName,isOwner:session.isOwner,isAdmin:session.isAdmin,canAccessAdmin:session.canAccessAdmin,expiresAt:session.expiresAt}}>{children}</AuthBoundary>;
}
