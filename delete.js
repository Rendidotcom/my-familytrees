// DELETE-PREMIUM-V6 — FIXED LOAD USERS
// Perbaikan utama:
// 1. GAS kamu hanya punya: mode=getdata, mode=getAll, mode=list, mode=getdatadetail
// 2. Script diperbaiki agar **selalu berhasil load** jika salah satu mode tersedia
// 3. Deteksi struktur row GAS yang umum: [ [id,nama,email,domisili], ... ]
// 4. Tidak lagi mengandalkan JSON nested yang mungkin tidak ada

(function(){
  'use strict';

  // ====== PREP ======
  const tbody = document.getElementById('userTableBody');
  const refreshBtn = document.getElementById('refreshBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const roleBadge = document.getElementById('roleBadge');

  let session = null;
  try { session = JSON.parse(localStorage.getItem('familyUser')||'null'); } catch(e){ session = null; }
  if(!session){ alert('Sesi hilang, login ulang.'); return location.href='login.html'; }

  const TOKEN = session.token;
  const MY_ID = String(session.id);
  const MY_ROLE = (session.role||'user').toLowerCase();

  if(roleBadge) roleBadge.innerHTML = `Peran: <b>${MY_ROLE}</b>`;

  const API = window.API_URL;
  if(!API){ console.error('API_URL hilang.'); return; }

  // ====== FETCH RAW ======
  async function raw(url){
    try{
      const r = await fetch(url);
      const t = await r.text();
      try { return { ok:true, json:JSON.parse(t), raw:t }; }
      catch(e){ return { ok:false, raw:t }; }
    }catch(e){ return { ok:false, error:String(e) }; }
  }

  // ====== PARSER UNIVERSAL ======
  // GAS sering mengirim arrayOfArray → kita ubah menjadi object
  function normalize(payload){
    if(!payload) return [];

    // CASE 1: langsung array of objects → aman
    if(Array.isArray(payload) && typeof payload[0] === 'object') return payload;

    // CASE 2: {data:[...]} atau {items:[...]}
    if(payload.data && Array.isArray(payload.data)) return payload.data;
    if(payload.items && Array.isArray(payload.items)) return payload.items;

    // CASE 3: array of array → Sheet1 typical
    if(Array.isArray(payload) && Array.isArray(payload[0])){
      return payload.map(row => {
        return {
          id: row[0] ?? '',
          name: row[1] ?? '',
          email: row[2] ?? '',
          domisili: row[3] ?? ''
        };
      });
    }

    return [];
  }

  // ====== RENDER ======
  function render(list){
    if(!list.length){
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666">Tidak ada data.</td></tr>';
      return;
    }

    const filtered = (MY_ROLE==='admin')
      ? list
      : list.filter(u => String(u.id) === MY_ID);

    const html = filtered.map(u => `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="mft-chk" value="${u.id}" ${ (MY_ROLE==='admin'||String(u.id)===MY_ID)?'':'disabled' }>
        </td>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.domisili||u.email}</td>
      </tr>
    `).join('');

    tbody.innerHTML = html;
  }

  // ====== FIXED LOAD USERS ======
  // Akan mencoba sesuai daftar mode GAS yang kamu sebut: list → getAll → getdata → getdatadetail

  async function loadUsers(){
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#777">Memuat...</td></tr>';

    const urls = [
      `${API}?mode=list&token=${TOKEN}`,
      `${API}?mode=getAll&token=${TOKEN}`,
      `${API}?mode=getdata&token=${TOKEN}`,
      `${API}?mode=getdatadetail&token=${TOKEN}`,
      `${API}?token=${TOKEN}` // fallback root
    ];

    for(const u of urls){
      const r = await raw(u);
      console.log('TRY:',u,r);
      if(r.ok && r.json){
        const arr = normalize(r.json.data || r.json || r.json.rows);
        if(arr.length){ render(arr); return; }
      }
    }

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#c00">Gagal memuat data.</td></tr>';
  }

  // ====== WIRE ======
  refreshBtn?.addEventListener('click',loadUsers);

  setTimeout(loadUsers,100);

})();
