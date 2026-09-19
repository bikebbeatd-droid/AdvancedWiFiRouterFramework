const rows=document.getElementById("rows"),status=document.getElementById("status"),selected=document.getElementById("selected"),button=document.getElementById("scan"),ifaceInput=document.getElementById("iface");
function quality(rssi){if(typeof rssi!=="number")return "--";return Math.max(0,Math.min(100,2*(rssi+100)))+"%"}
function render(networks){
 rows.innerHTML="";
 for(const n of networks){
  const tr=document.createElement("tr");
  [n.ssid||"(hidden)",n.security||"unknown",(n.rssi_dbm??"--")+" dBm",n.channel??"--",quality(n.rssi_dbm)].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);tr.appendChild(td)});
  const td=document.createElement("td"),b=document.createElement("button");
  b.textContent=n.authorized===true?"Use":"Authorize";
  b.onclick=async()=>{
   if(n.authorized!==true){
    try{
     const ar=await fetch("/api/networks/authorize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ssid:n.ssid,authorized:true})});
     if(!ar.ok)throw Error("Authorization failed");
     n.authorized=true;b.textContent="Use";
    }catch(e){status.textContent=e.message;return}
   }
   selected.textContent="Selected: "+(n.ssid||"(hidden)");
   location.href="wisp.html?ssid="+encodeURIComponent(n.ssid||"");
  };
  td.appendChild(b);tr.appendChild(td);rows.appendChild(tr);
 }
 if(!networks.length)rows.innerHTML='<tr><td colspan="6">No networks found</td></tr>';
}
async function scan(){
 button.disabled=true;status.textContent="Scanning…";
 try{
  const r=await fetch("/api/networks/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({interface:ifaceInput.value.trim()||"wlan0"}),cache:"no-store"});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||"Scan failed");
  render(data.networks||[]);status.textContent=(data.networks||[]).length+" network(s) found";
 }catch(e){status.textContent=e.message||"Scan failed"}finally{button.disabled=false}
}
button.addEventListener("click",scan);scan();