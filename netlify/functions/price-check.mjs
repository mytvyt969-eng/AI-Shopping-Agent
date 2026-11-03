import { createClient } from '@supabase/supabase-js';

// Scheduled Netlify Function: configure provider adapters before enabling live checks.
// Secrets belong in Netlify environment variables, never in src.js.
const supabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ ok:false, error:'Supabase environment variables are missing' }), {status:500});
  }
  const db=supabase();
  const {data:items,error}=await db.from('wishlist').select('*').eq('is_active',true);
  if(error) return new Response(JSON.stringify({ok:false,error:error.message}),{status:500});
  const results=[];
  for(const item of items||[]){
    try{
      const price=await fetchPrice(item);
      if(!Number.isFinite(price)||price<=0) throw new Error('Provider returned invalid price');
      const previous=Number(item.current_price);
      await db.from('price_history').insert({wishlist_id:item.id,price,checked_at:new Date().toISOString()});
      await db.from('wishlist').update({current_price:price,previous_price:previous,last_checked:new Date().toISOString()}).eq('id',item.id);
      if(price<=Number(item.target_price) && previous>Number(item.target_price)) await sendTelegram(item,price);
      results.push({id:item.id,ok:true,price});
    }catch(e){results.push({id:item.id,ok:false,error:e.message});}
  }
  return new Response(JSON.stringify({ok:true,checked:results.length,results}),{headers:{'content-type':'application/json'}});
};

async function fetchPrice(item){
  // Provider contract: PRICE_PROVIDER_URL receives {url,store,productId} and returns {price}.
  // Use a licensed/authorized provider or official retailer API. Do not scrape around anti-bot controls.
  if(!process.env.PRICE_PROVIDER_URL||!process.env.PRICE_PROVIDER_API_KEY) throw new Error('Price provider is not configured');
  const response=await fetch(process.env.PRICE_PROVIDER_URL,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.PRICE_PROVIDER_API_KEY}`},body:JSON.stringify({url:item.product_url,store:item.store,productId:item.provider_product_id||null})});
  if(!response.ok) throw new Error(`Price provider error ${response.status}`);
  const data=await response.json();return Number(data.price);
}
async function sendTelegram(item,price){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat) throw new Error('Telegram is not configured');
  const text=`🔔 Price target reached\n${item.product_name}\nCurrent: ₹${price}\nTarget: ₹${item.target_price}\n${item.product_url}`;
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text,disable_web_page_preview:false})});
  if(!r.ok) throw new Error('Telegram alert failed');
}
export const config={schedule:'*/30 * * * *'};