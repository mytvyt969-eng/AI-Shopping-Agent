import {createClient} from '@supabase/supabase-js';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
export default async request=>{
 if(request.method!=='POST')return json({error:'POST only'},405);
 // Authenticate this endpoint before production use (Supabase Auth JWT or your own session).
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)return json({error:'Supabase is not configured'},503);
 const body=await request.json().catch(()=>null);
 if(!body||!body.product_name||!body.product_url||!Number.isFinite(Number(body.target_price)))return json({error:'Product name, URL, and target price are required'},400);
 try{new URL(body.product_url)}catch{return json({error:'Invalid product URL'},400)}
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY);
 const {data,error}=await db.from('wishlist').insert({product_name:String(body.product_name).slice(0,200),product_url:body.product_url,store:String(body.store||'Other'),target_price:Number(body.target_price),current_price:body.current_price==null?null:Number(body.current_price),is_active:true}).select().single();
 if(error)return json({error:error.message},400);return json({product:data},201);
};