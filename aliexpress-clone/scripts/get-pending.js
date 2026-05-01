(async ()=>{
  try{
    const res = await fetch('http://localhost:3001/api/admin/ai-subscriptions/pending')
    const j = await res.json()
    console.log(JSON.stringify(j, null, 2))
  }catch(e){ console.error('ERR', e.message) }
})();
