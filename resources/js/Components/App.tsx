import { useEffect, useState } from 'react';

export default function App(){
  const [msg, setMsg] = useState('loading...');
  useEffect(()=>{
    fetch('/api/hello')
      .then(r=>r.json())
      .then(d=>setMsg(d.message))
      .catch(()=>setMsg('error'));
  },[]);
  return <div className="p-6"><h1>{msg}</h1></div>;
}
