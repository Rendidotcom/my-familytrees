function deleteMember(id, auth){
  const sheet = getSheet();
  const row = findRowById(id);
  if (row === -1) return {status:"error", message:"Tidak ditemukan"};

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Log sebelum menghapus
  getLogSheet().appendRow([
    new Date(),
    "DELETE",
    id,
    auth.name,
    JSON.stringify({ name: rowData[1] }),
    ""
  ]);

  sheet.deleteRow(row);

  return { status: "success", message: "Berhasil dihapus", id };
}

/**
 * Compatibility GET delete handler
 */
function handleDeleteViaGet(e){
  const token = e.parameter.token;
  const id = e.parameter.id;

  const auth = validateToken(token);
  if(!auth.valid) return {status:"error", message:"Unauthorized"};

  if(auth.role !== "admin" && String(auth.id) !== String(id)){
    return {status:"error", message:"Forbidden"};
  }

  return deleteMember(id, auth);
}

/* ========== EXTRA ENDPOINTS ========== */

function checkUserGet(name){
  if(!name) return {status:"error", message:"Missing name"};

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  for(let i = 1; i < values.length; i++){
    if(String(values[i][1]).trim().toLowerCase() === String(name).trim().toLowerCase()){
      return {status:"success", exists:true, id: values[i][9]};
    }
  }

  return {status:"success", exists:false};
}

function handleResetPinGet(e){
  const token = e.parameter.token;
  const id = e.parameter.id;

  const auth = validateToken(token);
  if(!auth.valid) return {status:"error", message:"Unauthorized"};
  if(auth.role !== "admin") return {status:"error", message:"Forbidden"};

  const sheet = getSheet();
  const row = findRowById(id);
  if(row === -1) return {status:"error", message:"ID tidak ditemukan"};

  sheet.getRange(row, 13).setValue("");

  getLogSheet().appendRow([
    new Date(),
    "RESET_PIN",
    id,
    auth.name,
    "",
    ""
  ]);

  return {status:"success", message:"PIN berhasil direset"};
}

