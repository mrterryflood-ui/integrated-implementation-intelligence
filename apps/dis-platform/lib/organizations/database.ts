import {Pool} from '@neondatabase/serverless';
export interface Queryable {query(sql:string,params?:any[]):Promise<{rows:any[]}>}
export async function inOrganizationTransaction<T>(actor:string,work:(db:Queryable)=>Promise<T>):Promise<T>{
 if(!actor||actor.length>200)throw Error('Authenticated identity required');
 if(!process.env.DIS_DATABASE_URL)throw Error('Organization database unavailable');
 const pool=new Pool({connectionString:process.env.DIS_DATABASE_URL,max:1,connectionTimeoutMillis:8000,idleTimeoutMillis:1000});
 let client;try{client=await pool.connect();}catch(error){await pool.end();throw error;}
 try{
  await client.query('BEGIN');
  const role=await client.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');
  if(!role.rows.length||role.rows[0].rolsuper||role.rows[0].rolbypassrls)throw Error('A restricted application database role is required');
  await client.query("SELECT set_config('dis.subject_id',$1,true),set_config('statement_timeout','15000',true),set_config('lock_timeout','5000',true)",[actor]);
  const result=await work(client as Queryable);await client.query('COMMIT');return result;
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}finally{client.release();await pool.end();}
}
