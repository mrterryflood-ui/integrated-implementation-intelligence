import {trustedProductionUploader} from '../release-gates';
import {inOrganizationTransaction, type Queryable} from './database';
import {lockOrganization, OrganizationError, uuid} from './service';
import {claimOriginalToken, completeOriginal, originalForOwner} from './storage';
import {ObjectStoreError, railwayObjectStore, railwayStorageConfiguration, spoolPrivateOriginal, validateRailwayObjectPath, type ObjectReceipt, type PrivateSpool} from './object-store';
type Transaction = <T>(actor: string, work: (db: Queryable) => Promise<T>) => Promise<T>;
type Store = Pick<typeof railwayObjectStore, 'putFile' | 'head'>;
export function createOrganizationObjectUpload(deps: {transaction?: Transaction; store?: Store; configured?: () => unknown; trusted?: (actor: string) => boolean} = {}) {
  const transaction = deps.transaction || inOrganizationTransaction, store = deps.store || railwayObjectStore;
  const trusted = deps.trusted || ((actor: string) => trustedProductionUploader(actor, process.env));
  const configured = deps.configured || railwayStorageConfiguration;
  const checkPath = (row: any, org: string, id: string) => {
    validateRailwayObjectPath(row.pathname);
    if (row.pathname !== 'railway/organizations/' + org + '/' + id + '/' + row.filename) throw new OrganizationError('The original does not belong to this storage reservation', 409);
  };
  const complete = async (actor: string, organizationId: unknown, reservationId: unknown, verifiedReceipt?: ObjectReceipt) => {
    const org = uuid(organizationId), id = uuid(reservationId); configured();
    const row = await transaction(actor, async db => {await lockOrganization(db, org, actor); const current = await originalForOwner(db, org, id, actor); checkPath(current, org, id);
      if (!['TOKEN_ISSUED', 'ARCHIVED'].includes(current.status) || !/^[a-f0-9]{64}$/.test(current.sha256 || '')) throw new OrganizationError('The original has no complete upload fingerprint to verify', 409); return current;});
    const receipt = verifiedReceipt || await store.head(row.pathname);
    if (receipt.pathname !== row.pathname || receipt.size !== Number(row.expected_bytes) || receipt.contentType !== row.media_type || receipt.sha256 !== row.sha256) throw new OrganizationError('Private storage does not match the reserved original and fingerprint', 409);
    const original = await transaction(actor, async db => {
      await lockOrganization(db, org, actor); const current = await originalForOwner(db, org, id, actor); checkPath(current, org, id);
      if (!['TOKEN_ISSUED', 'ARCHIVED'].includes(current.status) || current.pathname !== row.pathname || current.sha256 !== row.sha256 || Number(current.expected_bytes) !== Number(row.expected_bytes) || current.media_type !== row.media_type) throw new OrganizationError('The upload reservation changed while storage was checked', 409);
      return completeOriginal(db, actor, org, id, receipt);
    });
    return {original, receipt, retainsOriginal: true as const};
  };
  const upload = async (actor: string, organizationId: unknown, reservationId: unknown, body: ReadableStream<Uint8Array> | null, contentType: string, contentLength: string | null, signal?: AbortSignal) => {
    const org = uuid(organizationId), id = uuid(reservationId);
    if (!trusted(actor)) throw new OrganizationError('Uploads remain restricted to reviewed beta accounts until security and privacy acceptance', 403);
    configured();
    const row = await transaction(actor, async db => {
      await lockOrganization(db, org, actor); const current = await originalForOwner(db, org, id, actor); checkPath(current, org, id);
      if (contentType !== current.media_type || contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) !== Number(current.expected_bytes))) throw new OrganizationError('The original size or media type differs from its reservation', 409);
      return claimOriginalToken(db, actor, org, id, current.pathname);
    });
    let spool: PrivateSpool | undefined, possiblyStored = false;
    try {
      spool = await spoolPrivateOriginal(body, Number(row.expected_bytes), {signal});
      await transaction(actor, async db => {
        await lockOrganization(db, org, actor); const current = await originalForOwner(db, org, id, actor);
        if (current.status !== 'TOKEN_ISSUED' || current.pathname !== row.pathname || Number(current.expected_bytes) !== spool!.size || new Date(current.expires_at).getTime() <= Date.now()) throw new OrganizationError('The upload reservation changed or expired', 409);
        // Persist the expected fingerprint before PUT. Interrupted provider
        // responses can then be reconciled without freeing quota or overwriting.
        await db.query("UPDATE dis_organization_uploads SET sha256=$1,extraction_state='UPLOAD_FINGERPRINT_RECORDED' WHERE id=$2 AND organization_id=$3 AND owner_subject=$4", [spool!.sha256, id, org, actor]);
      });
      possiblyStored = true;
      const receipt = await store.putFile(row.pathname, spool, row.media_type);
      return await complete(actor, org, id, receipt);
    } catch (error) {
      if (!possiblyStored) await transaction(actor, async db => {
        await lockOrganization(db, org, actor);
        // The existing quota function releases REJECTED + NULL only: this is
        // reserved for a request that has provably never attempted provider PUT.
        await db.query("UPDATE dis_organization_uploads SET status='REJECTED',actual_bytes=NULL,extraction_state='UPLOAD_REJECTED_BEFORE_STORAGE' WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 AND status='TOKEN_ISSUED'", [id, org, actor]);
      }).catch(() => {});
      // Once PUT was attempted, keep TOKEN_ISSUED and its quota/fingerprint.
      // A lost response never authorizes deleting an existing private object.
      if (error instanceof ObjectStoreError || error instanceof OrganizationError) throw error;
      throw new ObjectStoreError('UPLOAD_NOT_CONFIRMED', 'Storage completion was not confirmed. Verify the retained reservation before retrying.');
    } finally {await spool?.cleanup();}
  };
  return {upload, complete: (actor: string, org: unknown, id: unknown) => complete(actor, org, id)};
}
export const organizationObjectUpload = createOrganizationObjectUpload();
