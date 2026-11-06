/** A public, immutable-per-build retrieval contract for authorized DIS agents.
 *
 * Only policy documents already in the public source repository are exposed.
 * Retrieving or hashing instructions DOES NOT constitute acceptance, compliance,
 * verification of behavioral outcomes, permission to send or private access.
 */
import {createHash} from 'node:crypto';
import {DIS_OPERATING_CONTRACT} from './generated/dis-operating-contract';
import {DIS_FEDERATED_STANDARD} from './generated/dis-federated-standard';
import {DIS_ENGINEERING_STANDARD} from './generated/dis-engineering-standard';

export type PublicStandardDocument={
  id:'dis-gpt-operating-contract'|'dis-federated-evidence-standard'|'dis-stack-agnostic-engineering';
  version:string;sourcePath:string;sha256:string;content:string;
  contentType:'text/markdown';
};
const digest=(x:string)=>createHash('sha256').update(x,'utf8').digest('hex');
export function publicAgentStandard(){
  const operating:PublicStandardDocument={
    id:'dis-gpt-operating-contract',version:DIS_OPERATING_CONTRACT.version,
    sourcePath:DIS_OPERATING_CONTRACT.sourcePath,
    sha256:DIS_OPERATING_CONTRACT.sha256,
    content:DIS_OPERATING_CONTRACT.text,contentType:'text/markdown'
  };
  const federation:PublicStandardDocument={
    id:'dis-federated-evidence-standard',version:DIS_FEDERATED_STANDARD.version,
    sourcePath:DIS_FEDERATED_STANDARD.sourcePath,
    sha256:digest(DIS_FEDERATED_STANDARD.text),
    content:DIS_FEDERATED_STANDARD.text,contentType:'text/markdown'
  };
  const engineering:PublicStandardDocument={
    id:'dis-stack-agnostic-engineering',version:DIS_ENGINEERING_STANDARD.version,
    sourcePath:DIS_ENGINEERING_STANDARD.sourcePath,
    sha256:digest(DIS_ENGINEERING_STANDARD.text),
    content:DIS_ENGINEERING_STANDARD.text,contentType:'text/markdown'
  };
  if(digest(operating.content)!==operating.sha256)
    throw new Error('DIS standard integrity check failed; no policy manifest may be served.');
  return {
    schemaVersion:'dis-agent-standard-manifest-v1' as const,
    standard:'DIS · Dynamic / Diagnostic Implementation Science — federated evidence, inquiry, and engineering assurance',
    governingScope:'PUBLIC_DOCUMENTS_ONLY' as const,
    publication:'SERVER_VERIFIED_CONTENT_COPY' as const,
    behaviorVerified:false as const,
    otherAgentsAdopted:false as const,
    userPermissionOrOperationalAuthorityGranted:false as const,
    appliesWhen:'Consequential multi-source research, planning, implementation, app development, code release, governance, and review of uncertain or shifting measures; proportionate to stakes.',
    usePolicy:[
      'Obtain the expected SHA-256 from an independently trusted source and compare it with the hash of each downloaded document. A digest returned in the same HTTP response alone does not authenticate the server.',
      'Explicitly adopt each document in an agent integration controlled by its authorized owner. Merely fetching a document does not change an agent system prompt, ChatGPT memory, or application behavior.',
      'Apply the hierarchy of existing safety/security, privacy, legal, platform and human-authority requirements. The fetched text is not permission for new actions, external messages or paid services.',
      'Trace requested decision to fit-for-purpose measurements, compatible geography/time, source independence, uncertainty, counterfactuals, unintended consequences and day-after-success stewardship.',
      'Document the applied document ID/version/digest, exact consuming application/revision, independent tests, permission, observed output, limitations and rollback before reporting adoption.'
    ],
    documents:[operating,federation,engineering],
    verification:{
      algorithm:'SHA-256',
      formula:'sha256(exact UTF-8 content bytes) for each documents[].content',
      sourceOfTruth:'https://github.com/mrterryflood-ui/integrated-implementation-intelligence/tree/main/docs/dis',
      warning:'These checks verify content consistency, not the empirical truth of source claims or agent compliance.'
    },
    adoption:{
      status:'PUBLISHED_FOR_AUTHORIZED_CONSUMERS_NOT_AUTO_INSTALLED',
      required:['Choose a compatible agent with an authorized owner','Verify each source digest against an independently trusted pin',
        'Load the relevant documents into that agent using its supported instructions mechanism',
        'Test with known good and conflicting evidence, duplicated sources, invalid metrics, safety and human-authority cases',
        'Record an exact consumer application commit/receipt; monitor and re-approve later revisions']
    },
    warning:'This public discovery endpoint cannot rewrite ChatGPT system instructions, install plugins, validate kidney therapies, authorize clinical care, or configure external systems.'
  };
}
