// ==============================================
// TL Mate - Backend Google Apps Script (GAS)
// ==============================================

const API_KEY = 'TL-MATE-2026';

function getDbId_() {
  return PropertiesService.getScriptProperties().getProperty('DB_ID');
}

// --- MAIN HANDLERS ---
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    const isPost = method === 'POST';
    const rawData = isPost ? e.postData.contents : e.parameter.data;
    if (!rawData) return jsonOut({ success: false, error: 'No data provided' });

    const req = JSON.parse(rawData);
    if (req.api_key !== API_KEY) {
      return jsonOut({ success: false, error: 'Unauthorized' });
    }

    const action = req.action;
    const payload = req.payload || {};
    
    let result = { success: false, error: 'Unknown action' };

    switch (action) {
      case 'login': result = actionLogin(payload); break;
      case 'register': result = actionRegister(payload); break;
      case 'changePassword': result = actionChangePassword(payload); break;
      case 'updateProfile': result = actionUpdateProfile(payload); break;
      
      case 'getTools': result = actionGetTools(); break;
      case 'saveTool': result = actionSaveTool(payload); break;
      case 'deleteTool': result = actionDeleteTool(payload); break;
      
      case 'getSOPs': result = actionGetSOPs(); break;
      case 'getQuizzes': result = actionGetQuizzes(); break;
      
      case 'getProducts': result = actionGetProducts(); break;
      case 'saveProduct': result = actionSaveProduct(payload); break;
      case 'deleteProduct': result = actionDeleteProduct(payload); break;
      
      case 'getHistory': result = actionGetHistory(payload); break;
      case 'saveHistory': result = actionSaveHistory(payload); break;
      
      case 'getTransactions': result = actionGetTransactions(payload); break;
      case 'createTransaction': result = actionCreateTransaction(payload); break;
      case 'updateTransactionStatus': result = actionUpdateTransactionStatus(payload); break;
      case 'forceInit': 
        initDatabase();
        result = { success: true, message: 'Database forced init' };
        break;
    }
    return jsonOut(result);

  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  }
}

// --- ACTIONS ---

function actionLogin(payload) {
  const users = sheetToObjects('users');
  const hashedPw = hash_(payload.password);
  const user = users.find(u => u.email === payload.email && u.password === hashedPw);
  
  if (user) {
    delete user.password; // Do not return password hash
    return { success: true, data: user };
  }
  return { success: false, error: 'Email atau password salah' };
}

function actionRegister(payload) {
  const usersSheet = getSheet_('users');
  const users = sheetToObjects('users', usersSheet);
  
  if (users.some(u => u.email === payload.email)) {
    return { success: false, error: 'Email sudah terdaftar' };
  }
  
  const newUser = {
    id: Date.now(),
    name: payload.name,
    nim: payload.nim,
    email: payload.email,
    password: hash_(payload.password),
    role: 'mahasiswa',
    photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=2A6055&color=fff&size=128`
  };
  
  appendObject_('users', newUser, usersSheet);
  delete newUser.password;
  return { success: true, data: newUser };
}

function actionChangePassword(payload) {
  const usersSheet = getSheet_('users');
  const users = sheetToObjects('users', usersSheet);
  const rowIndex = users.findIndex(u => u.id == payload.user_id);
  
  if (rowIndex === -1) return { success: false, error: 'User not found' };
  
  const user = users[rowIndex];
  if (user.password !== hash_(payload.old)) {
    return { success: false, error: 'Password lama salah' };
  }
  
  updateRow_('users', rowIndex, { password: hash_(payload.new) }, usersSheet);
  return { success: true };
}

function actionUpdateProfile(payload) {
  const usersSheet = getSheet_('users');
  const users = sheetToObjects('users', usersSheet);
  const rowIndex = users.findIndex(u => u.id == payload.user_id);
  
  if (rowIndex === -1) return { success: false, error: 'User not found' };
  
  updateRow_('users', rowIndex, { photo_url: payload.photo_url }, usersSheet);
  return { success: true };
}

function actionGetTools() {
  const tools = sheetToObjects('tools').map(t => {
    t.parts = t.parts ? JSON.parse(t.parts) : [];
    return t;
  });
  return { success: true, data: tools };
}

function actionSaveTool(payload) {
  const toolSheet = getSheet_('tools');
  const tools = sheetToObjects('tools', toolSheet);
  const toolData = payload.tool;
  const sopsData = payload.sops || []; // List of sops
  
  const rowData = { ...toolData, parts: JSON.stringify(toolData.parts || []) };
  
  if (toolData.id) {
    const idx = tools.findIndex(t => t.id == toolData.id);
    if (idx > -1) updateRow_('tools', idx, rowData, toolSheet);
    else appendObject_('tools', rowData, toolSheet);
  } else {
    toolData.id = Date.now();
    rowData.id = toolData.id;
    appendObject_('tools', rowData, toolSheet);
  }
  
  // Replace SOPs
  const sopsSheet = getSheet_('sops');
  let allSops = sheetToObjects('sops', sopsSheet);
  
  // Find rows to delete (reverse to not mess up indices)
  for (let i = allSops.length - 1; i >= 0; i--) {
    if (allSops[i].tool_id == toolData.id) {
      sopsSheet.deleteRow(i + 2); // +2 for header offset
    }
  }
  
  // Append new SOPs
  sopsData.forEach(s => {
    s.id = s.id || (Date.now() + Math.random());
    s.tool_id = toolData.id;
    appendObject_('sops', s, sopsSheet);
  });
  
  return { success: true, data: { id: toolData.id } };
}

function actionDeleteTool(payload) {
  const toolId = payload.id;
  const toolSheet = getSheet_('tools');
  const tools = sheetToObjects('tools', toolSheet);
  const idx = tools.findIndex(t => t.id == toolId);
  if (idx > -1) toolSheet.deleteRow(idx + 2);
  
  const sopsSheet = getSheet_('sops');
  const sops = sheetToObjects('sops', sopsSheet);
  for (let i = sops.length - 1; i >= 0; i--) {
    if (sops[i].tool_id == toolId) sopsSheet.deleteRow(i + 2);
  }
  
  return { success: true };
}

function actionGetSOPs() {
  return { success: true, data: sheetToObjects('sops') };
}

function actionGetQuizzes() {
  return { success: true, data: sheetToObjects('quizzes') };
}

function actionGetProducts() {
  const p = sheetToObjects('products').map(x => ({...x, price: Number(x.price), stock: Number(x.stock)}));
  return { success: true, data: p };
}

function actionSaveProduct(payload) {
  const sheet = getSheet_('products');
  const items = sheetToObjects('products', sheet);
  if (payload.id) {
    const idx = items.findIndex(p => p.id == payload.id);
    if (idx > -1) updateRow_('products', idx, payload, sheet);
    else appendObject_('products', payload, sheet);
  } else {
    payload.id = Date.now();
    appendObject_('products', payload, sheet);
  }
  return { success: true, data: { id: payload.id } };
}

function actionDeleteProduct(payload) {
  const sheet = getSheet_('products');
  const items = sheetToObjects('products', sheet);
  const idx = items.findIndex(p => p.id == payload.id);
  if (idx > -1) sheet.deleteRow(idx + 2);
  return { success: true };
}

function actionGetHistory(payload) {
  let hist = sheetToObjects('history').map(h => ({...h, score: Number(h.score)}));
  if (payload && payload.user_id) {
    hist = hist.filter(h => h.user_id == payload.user_id);
  }
  return { success: true, data: hist };
}

function actionSaveHistory(payload) {
  // fill user details from users sheet? Assume payload provides valid user_name/nim or BE looks it up.
  // We'll trust payload for user_name, user_nim, score.
  const row = {
    id: Date.now(),
    user_id: payload.user_id,
    user_name: payload.user_name || 'User',
    user_nim: payload.user_nim || '-',
    tool_id: payload.tool_id,
    score: payload.score,
    date: payload.date || new Date().toLocaleDateString('id-ID')
  };
  appendObject_('history', row);
  return { success: true };
}

function actionGetTransactions(payload) {
  let txs = sheetToObjects('transactions').map(t => {
    t.items = t.items ? JSON.parse(t.items) : [];
    t.total = Number(t.total);
    return t;
  });
  if (payload && payload.user_id && payload.role !== 'admin') {
    txs = txs.filter(t => t.user_id == payload.user_id);
  }
  return { success: true, data: txs };
}

function actionCreateTransaction(payload) {
  const row = {
    id: payload.id, // ID generated by FE
    user_id: payload.user_id,
    user_name: payload.user_name,
    date: payload.date,
    items: JSON.stringify(payload.items || []),
    total: payload.total,
    status: 'pending'
  };
  appendObject_('transactions', row);
  return { success: true };
}

function actionUpdateTransactionStatus(payload) {
  const sheet = getSheet_('transactions');
  const txs = sheetToObjects('transactions', sheet);
  const idx = txs.findIndex(t => t.id == payload.id);
  if (idx === -1) return { success: false, error: 'Tx not found' };
  
  const current = txs[idx].status;
  const target = payload.status;
  
  // Validation based on FE logic mapping
  const allowed = {
    'pending': ['approved', 'cancelled'],
    'approved': ['shipped', 'done', 'cancelled'],
    'shipped': ['done', 'cancelled'],
    'done': [],
    'cancelled': []
  };
  
  if (!allowed[current] || !allowed[current].includes(target)) {
    return { success: false, error: 'Invalid status transition' };
  }
  
  updateRow_('transactions', idx, { status: target }, sheet);
  return { success: true };
}


// --- UTILS ---

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function hash_(text) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return Utilities.base64Encode(rawHash);
}

function getSheet_(name) {
  const dbId = getDbId_();
  if (!dbId) throw new Error("Database belum diinisialisasi. Silakan jalankan initDatabase() di Apps Script.");
  const ss = SpreadsheetApp.openById(dbId);
  return ss.getSheetByName(name);
}

function sheetToObjects(sheetName, sheetObj) {
  const sheet = sheetObj || getSheet_(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendObject_(sheetName, obj, sheetObj) {
  const sheet = sheetObj || getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj.hasOwnProperty(h) ? obj[h] : '');
  sheet.appendRow(row);
}

function updateRow_(sheetName, rowIndex, updates, sheetObj) {
  const sheet = sheetObj || getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const targetRow = rowIndex + 2; // +1 for 0-index, +1 for header
  
  headers.forEach((h, i) => {
    if (updates.hasOwnProperty(h)) {
      sheet.getRange(targetRow, i + 1).setValue(updates[h]);
    }
  });
}

// --- SETUP ---
// Run this manually once from Apps Script Editor
function initDatabase() {
  let dbId = getDbId_();
  let ss;
  
  if (!dbId) {
    // Buat folder "TL Mate 2" di root Drive jika belum ada
    let folderIterator = DriveApp.getFoldersByName("TL Mate 2");
    let folder;
    if (folderIterator.hasNext()) {
      folder = folderIterator.next();
    } else {
      folder = DriveApp.createFolder("TL Mate 2");
    }
    
    // Buat file spreadsheet baru
    ss = SpreadsheetApp.create("Database TL Mate 2");
    
    // Pindahkan file ke dalam folder yang baru dibuat
    let file = DriveApp.getFileById(ss.getId());
    file.moveTo(folder);
    
    // Simpan ID spreadsheet di properties
    PropertiesService.getScriptProperties().setProperty('DB_ID', ss.getId());
    Logger.log("Berhasil membuat database baru di folder TL Mate 2 dengan ID: " + ss.getId());
  } else {
    ss = SpreadsheetApp.openById(dbId);
    Logger.log("Menggunakan database yang sudah ada: " + dbId);
  }
  
  const schemas = {
    users: ['id', 'name', 'nim', 'email', 'password', 'role', 'photo_url'],
    tools: ['id', 'jenis', 'name', 'img', 'desc', 'function', 'video_url', 'parts'],
    sops: ['id', 'tool_id', 'step_title', 'content'],
    quizzes: ['id', 'tool_id', 'question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'answer'],
    products: ['id', 'name', 'price', 'img', 'link', 'stock'],
    history: ['id', 'user_id', 'user_name', 'user_nim', 'tool_id', 'score', 'date'],
    transactions: ['id', 'user_id', 'user_name', 'date', 'items', 'total', 'status']
  };
  
  Object.keys(schemas).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, schemas[name].length).setValues([schemas[name]]);
  });
  
  // Seed admin
  const users = sheetToObjects('users');
  if (users.length === 0) {
    appendObject_('users', {
      id: 2, name: 'Admin Laboratorium', nim: '-', email: 'admin@poltekkes.ac.id',
      password: hash_('admin123'), role: 'admin',
      photo_url: 'https://ui-avatars.com/api/?name=Admin+Lab&background=EFA93C&color=fff&size=128'
    });
    
    // Seed 1 tool as example
    appendObject_('tools', {
      id: 1, jenis: 'Optik', name: 'Mikroskop Binokuler Olympus CX23', 
      img: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80',
      desc: 'Mikroskop standar untuk praktikum.', function: 'Mengamati sediaan mikroskopis.', video_url: '',
      parts: JSON.stringify([{name: 'Lensa Okuler', desc: 'Lensa dekat mata.'}])
    });
  }
}
