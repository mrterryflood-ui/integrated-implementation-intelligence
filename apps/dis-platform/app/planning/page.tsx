import {auth, currentUser} from '@clerk/nextjs/server';
import {SignIn} from '@clerk/nextjs';
import {productionIdentityBlocked} from '../../lib/release-gates';
import OrganizationTerminal from './terminal';
import './planning.css';
export const dynamic='force-dynamic';
export default async function PlanningPage(){
 if(productionIdentityBlocked(process.env))return <main className="org-access"><p className="org-eyebrow">ORGANIZATION PLANNING</p><h1>Your shared plan. Your evidence. Your decisions.</h1><p>The organizational terminal is protected while production sign-in is configured. No development identity or sample organization is being presented as your live workspace.</p><section><h2>Account configuration required</h2><p>The existing Clerk integration in Vercel requires a production domain. Keep the same integration; configure its domain, let the provider synchronize its production keys, then redeploy and verify real member access.</p><p>Organization membership, private drafts and approval authority remain separate. No invitations or emails are sent by opening this page.</p></section><p><a href="/api/planning/template?format=docx">Editable Word template</a> · <a href="/api/planning/template?format=csv">Editable CSV template</a> · <a href="/#consult">Public consultation studio</a></p></main>;
 const {userId}=await auth();if(!userId)return <main className="org-access"><h1>Sign in to your organization terminal</h1><p>Use your own account. An organization administrator must approve membership before shared information is visible.</p><SignIn routing="hash"/></main>;
 const user=await currentUser();return <OrganizationTerminal subject={userId} displayName={[user?.firstName,user?.lastName].filter(Boolean).join(' ')||'Member'}/>;
}
