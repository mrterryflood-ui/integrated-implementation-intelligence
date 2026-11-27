import {auth, currentUser} from '@clerk/nextjs/server';
import {SignIn} from '@clerk/nextjs';
import {productionIdentityBlocked} from '../../lib/release-gates';
import OrganizationTerminal from './terminal';
import {planningReturnPath} from '../../lib/planning-navigation';
import './planning.css';
export const dynamic='force-dynamic';
export default async function PlanningPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const returnPath=planningReturnPath(await searchParams);
 if(productionIdentityBlocked(process.env))return <main className="org-access"><p className="org-eyebrow">ORGANIZATION PLANNING</p><h1>Your shared plan. Your evidence. Your decisions.</h1><p>The organizational terminal is protected while production sign-in is configured. No development identity or sample organization is being presented as your live workspace.</p><section><h2>Account configuration required</h2><p>Sign-in requires the existing identity provider’s production domain and keys on this deployment. An administrator must finish that configuration and verify member access.</p><p>Organization membership, private drafts and approval authority remain separate. No invitations or emails are sent by opening this page.</p></section><p><a href="/api/planning/template?format=docx">Editable Word template</a> · <a href="/api/planning/template?format=csv">Editable CSV template</a> · <a href="/#consult">Public consultation studio</a></p></main>;
 const {userId}=await auth();if(!userId)return <main className="org-access"><h1>Sign in to your DIS workspace</h1><p>Use Google sign-in if offered, or the verified email method. If your email was preapproved for this organization, your contributor dashboard opens automatically after sign-in. Never share an account.</p><SignIn routing="hash" forceRedirectUrl={returnPath}/></main>;
 const user=await currentUser();return <OrganizationTerminal subject={userId} displayName={[user?.firstName,user?.lastName].filter(Boolean).join(' ')||'Member'}/>;
}
