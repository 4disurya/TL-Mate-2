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
      case 'getUsers': result = actionGetUsers(payload); break;
      case 'resetPassword': result = actionResetPassword(payload); break;
      
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
      case 'ping': result = { success: true, message: 'pong' }; break;
      case 'forceInit': 
        initDatabase();
        result = { success: true, message: 'Database forced init' };
        break;
      case 'seedProducts':
        initDatabase();
        seedProducts();
        result = { success: true, message: 'Products seeded' };
        break;
      case 'seedTools':
        initDatabase();
        seedTools();
        result = { success: true, message: 'Tools and SOPs seeded' };
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
  const user = users.find(u => u.email === payload.email && (u.password === hashedPw || u.password === payload.password));
  
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
  const hashedOld = hash_(payload.old);
  if (user.password !== hashedOld && user.password !== payload.old) {
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

function actionGetUsers(payload) {
  if (payload.role !== 'admin') return { success: false, error: 'Unauthorized' };
  const users = sheetToObjects('users').map(u => {
    delete u.password;
    return u;
  });
  return { success: true, data: users };
}

function actionResetPassword(payload) {
  if (payload.role !== 'admin') return { success: false, error: 'Unauthorized' };
  if (!payload.new_password || payload.new_password.length < 6) return { success: false, error: 'Password min 6 karakter' };
  
  const sheet = getSheet_('users');
  const users = sheetToObjects('users', sheet);
  const idx = users.findIndex(u => u.id == payload.user_id);
  if (idx === -1) return { success: false, error: 'User tidak ditemukan' };
  
  updateRow_('users', idx, { password: hash_(payload.new_password) }, sheet);
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
  const users = sheetToObjects('users');
  const user = users.find(u => u.id == payload.user_id) || {};
  
  const hSheet = getSheet_('history');
  const hList = sheetToObjects('history', hSheet);
  
  const existingIdx = hList.findIndex(h => h.user_id == payload.user_id && h.tool_id == payload.tool_id);
  
  if (existingIdx > -1) {
    const existing = hList[existingIdx];
    if (payload.score > Number(existing.score)) {
      updateRow_('history', existingIdx, {
        id: Date.now(),
        score: payload.score,
        date: payload.date || new Date().toLocaleDateString('id-ID')
      }, hSheet);
      return { success: true, message: 'Skor diperbarui' };
    } else {
      return { success: true, message: 'Skor tidak lebih tinggi' };
    }
  }

  const row = {
    id: Date.now(),
    user_id: payload.user_id,
    user_name: payload.user_name || user.name || 'User',
    user_nim: payload.user_nim || user.nim || '-',
    tool_id: payload.tool_id,
    score: payload.score,
    date: payload.date || new Date().toLocaleDateString('id-ID')
  };
  appendObject_('history', row, hSheet);
  return { success: true, message: 'Skor baru ditambahkan' };
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
function seedTools() {
  const toolsSheet = getSheet_('tools');
  const sopsSheet = getSheet_('sops');
  
  // Clear existing (excluding header)
  if (toolsSheet.getLastRow() > 1) {
    toolsSheet.getRange(2, 1, toolsSheet.getLastRow() - 1, toolsSheet.getLastColumn()).clearContent();
  }
  if (sopsSheet.getLastRow() > 1) {
    sopsSheet.getRange(2, 1, sopsSheet.getLastRow() - 1, sopsSheet.getLastColumn()).clearContent();
  }
  
  const toolsData = [
  { id: 1, name: 'Mikroskop Binokuler', jenis: 'Optik', img: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80', desc: 'Alat optik yang digunakan untuk memperbesar objek atau spesimen berukuran sangat kecil sehingga dapat diamati secara jelas.', function: 'Mengamati sel darah, bakteri, parasit, jaringan, sedimen urine, dan preparat laboratorium lainnya.', parts: JSON.stringify([{name: 'Lensa okuler', desc: 'Lensa dekat mata.'}, {name: 'Lensa objektif', desc: 'Lensa dekat preparat.'}, {name: 'Revolver', desc: 'Pemutar lensa objektif.'}, {name: 'Meja preparat', desc: 'Tempat meletakkan kaca objek.'}, {name: 'Kondensor', desc: 'Mengumpulkan cahaya.'}, {name: 'Diafragma', desc: 'Mengatur intensitas cahaya masuk.'}, {name: 'Lampu', desc: 'Sumber cahaya.'}, {name: 'Pengatur kasar/macrometer', desc: 'Fokus cepat.'}, {name: 'Pengatur halus/micrometer', desc: 'Fokus presisi.'}, {name: 'Pengatur intensitas cahaya', desc: 'Mengatur terang cahaya.'}]) },
  { id: 2, name: 'Centrifuge', jenis: 'Sampel', img: 'https://images.unsplash.com/photo-1628189852277-2273617be3dd?auto=format&fit=crop&w=600&q=80', desc: 'Alat yang memisahkan komponen sampel berdasarkan perbedaan massa jenis menggunakan gaya sentrifugal.', function: 'Memisahkan serum, plasma, sedimen urine, sel darah, dan komponen sampel lainnya.', parts: JSON.stringify([{name: 'Rotor', desc: 'Pemutar sampel.'}, {name: 'Bucket/holder tabung', desc: 'Tempat menaruh tabung.'}, {name: 'Tutup centrifuge', desc: 'Pelindung ruang putar.'}, {name: 'Panel kontrol', desc: 'Layar pengaturan.'}, {name: 'Pengatur RPM', desc: 'Pengatur kecepatan.'}, {name: 'Timer', desc: 'Pengatur waktu.'}, {name: 'Sistem pengunci tutup', desc: 'Keamanan saat mesin berjalan.'}]) },
  { id: 3, name: 'Mikropipet', jenis: 'Sampel', img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80', desc: 'Alat laboratorium untuk mengambil dan memindahkan cairan dengan volume sangat kecil secara presisi.', function: 'Mengukur dan memindahkan sampel atau reagen dalam satuan mikroliter.', parts: JSON.stringify([{name: 'Plunger button', desc: 'Tombol hisap dan tekan.'}, {name: 'Volume adjustment', desc: 'Pemutar volume.'}, {name: 'Volume display', desc: 'Layar volume.'}, {name: 'Tip ejector', desc: 'Pelepas tip.'}, {name: 'Tip cone', desc: 'Ujung pasang tip.'}, {name: 'Disposable tip', desc: 'Tip sekali pakai.'}]) },
  { id: 4, name: 'Autoclave', jenis: 'Sterilisasi', img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80', desc: 'Alat sterilisasi yang menggunakan uap air bertekanan dan temperatur tinggi.', function: 'Mensterilkan media, alat gelas, instrumen, dan bahan laboratorium yang tahan panas dan tekanan.', parts: JSON.stringify([{name: 'Chamber', desc: 'Ruang sterilisasi.'}, {name: 'Tutup autoclave', desc: 'Penutup kedap udara.'}, {name: 'Pressure gauge', desc: 'Pengukur tekanan.'}, {name: 'Temperature controller', desc: 'Pengatur suhu.'}, {name: 'Safety valve', desc: 'Katup pengaman.'}, {name: 'Heater', desc: 'Pemanas.'}, {name: 'Water reservoir', desc: 'Tampungan air.'}, {name: 'Timer', desc: 'Pengatur waktu.'}]) },
  { id: 5, name: 'Biosafety Cabinet', jenis: 'Sterilisasi', img: 'https://images.unsplash.com/photo-1605634563445-6c702c28de83?auto=format&fit=crop&w=600&q=80', desc: 'Kabinet kerja dengan sistem aliran udara terkontrol dan filtrasi HEPA untuk membantu melindungi pekerja, sampel, dan lingkungan dari kontaminasi biologis.', function: 'Digunakan untuk pekerjaan mikrobiologi dan manipulasi bahan biologis yang membutuhkan area kerja terkontrol.', parts: JSON.stringify([{name: 'HEPA filter', desc: 'Penyaring partikel mikro.'}, {name: 'Work surface', desc: 'Meja kerja.'}, {name: 'Front opening', desc: 'Bukaan depan.'}, {name: 'Blower', desc: 'Kipas sirkulasi.'}, {name: 'Air grille', desc: 'Kisi udara.'}, {name: 'Lampu kerja', desc: 'Penerangan utama.'}, {name: 'UV lamp, jika tersedia', desc: 'Sterilisasi cahaya.'}, {name: 'Panel kontrol', desc: 'Pusat pengaturan.'}]) },
  { id: 6, name: 'Hematology Analyzer', jenis: 'Hematologi', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', desc: 'Instrumen otomatis untuk menghitung dan menganalisis komponen sel darah.', function: 'Melakukan pemeriksaan darah lengkap seperti:\n- Hemoglobin\n- Hematokrit\n- Eritrosit\n- Leukosit\n- Trombosit\n- Indeks eritrosit', parts: JSON.stringify([{name: 'Sample aspiration probe', desc: 'Jarum hisap sampel.'}, {name: 'Sample chamber', desc: 'Ruang baca.'}, {name: 'Reagent system', desc: 'Sistem reagen.'}, {name: 'Detector', desc: 'Sensor pembacaan.'}, {name: 'Fluidics system', desc: 'Sistem cairan.'}, {name: 'Display', desc: 'Layar hasil.'}, {name: 'Printer/interface', desc: 'Output data.'}, {name: 'Waste container', desc: 'Wadah limbah.'}]) },
  { id: 7, name: 'Hemocytometer', jenis: 'Hematologi', img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=600&q=80', desc: 'Kamar hitung khusus yang digunakan untuk menghitung sel secara manual di bawah mikroskop.', function: 'Menghitung eritrosit, leukosit, trombosit, atau sel lainnya.', parts: JSON.stringify([{name: 'Counting chamber', desc: 'Kamar hitung.'}, {name: 'Grid', desc: 'Garis hitung.'}, {name: 'Cover glass khusus', desc: 'Kaca penutup.'}, {name: 'Area penghitungan', desc: 'Zona perhitungan.'}]) },
  { id: 8, name: 'Chemistry Analyzer', jenis: 'Kimia', img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=600&q=80', desc: 'Instrumen yang digunakan untuk menganalisis berbagai parameter kimia dalam serum, plasma, urine, atau cairan tubuh.', function: 'Pemeriksaan seperti:\n- Glukosa\n- Kolesterol\n- Asam urat\n- Ureum\n- Kreatinin\n- SGOT/AST\n- SGPT/ALT\n- Protein\n- Albumin', parts: JSON.stringify([{name: 'Sample tray', desc: 'Rak sampel.'}, {name: 'Reagent tray', desc: 'Rak reagen.'}, {name: 'Reaction cuvette', desc: 'Kuvet reaksi.'}, {name: 'Pipetting system', desc: 'Sistem pipet otomatis.'}, {name: 'Optical detector', desc: 'Detektor optik.'}, {name: 'Incubator', desc: 'Inkubator suhu.'}, {name: 'Washing system', desc: 'Sistem pencucian.'}, {name: 'Control panel', desc: 'Panel kendali.'}]) },
  { id: 9, name: 'pH Meter', jenis: 'Kimia', img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=600&q=80', desc: 'Alat elektronik untuk menentukan derajat keasaman atau kebasaan suatu larutan.', function: 'Mengukur nilai pH larutan, media, dan reagen laboratorium.', parts: JSON.stringify([{name: 'Electrode', desc: 'Elektroda sensor.'}, {name: 'Temperature sensor', desc: 'Sensor suhu.'}, {name: 'Display', desc: 'Layar digital.'}, {name: 'Calibration button', desc: 'Tombol kalibrasi.'}, {name: 'Probe holder', desc: 'Penyangga elektroda.'}]) },
  { id: 10, name: 'PCR / Thermal Cycler', jenis: 'Molekuler', img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=600&q=80', desc: 'Instrumen yang digunakan untuk memperbanyak fragmen DNA melalui proses Polymerase Chain Reaction.', function: 'Amplifikasi DNA untuk analisis molekuler, identifikasi mikroorganisme, pemeriksaan genetik, dan penelitian.', parts: JSON.stringify([{name: 'Thermal block', desc: 'Blok pemanas.'}, {name: 'Heated lid', desc: 'Tutup pemanas.'}, {name: 'Control panel', desc: 'Panel kendali.'}, {name: 'Temperature control system', desc: 'Pengatur suhu.'}, {name: 'PCR tube holder', desc: 'Tempat tabung.'}]) },
  { id: 11, name: 'Real-Time PCR', jenis: 'Molekuler', img: 'https://images.unsplash.com/photo-1532187863486-abf92fbe0cfb?auto=format&fit=crop&w=600&q=80', desc: 'Instrumen PCR yang dapat mendeteksi proses amplifikasi DNA secara real-time menggunakan sinyal fluoresensi.', function: 'Mendeteksi dan mengukur DNA/RNA target secara kualitatif maupun kuantitatif.', parts: JSON.stringify([{name: 'Thermal block', desc: 'Blok termal.'}, {name: 'Optical detection system', desc: 'Sistem optik.'}, {name: 'Fluorescence detector', desc: 'Detektor fluoresensi.'}, {name: 'Heated lid', desc: 'Tutup berpenghangat.'}, {name: 'Software analisis', desc: 'Perangkat lunak.'}, {name: 'PCR plate/tube holder', desc: 'Dudukan plate.'}]) },
  { id: 12, name: 'Electrophoresis', jenis: 'Molekuler', img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=600&q=80', desc: 'Alat yang memisahkan DNA, RNA, atau protein berdasarkan ukuran dan muatan menggunakan medan listrik.', function: 'Memisahkan serta membantu identifikasi produk PCR atau biomolekul lainnya.', parts: JSON.stringify([{name: 'Electrophoresis chamber', desc: 'Ruang elektroforesis.'}, {name: 'Gel tray', desc: 'Baki gel.'}, {name: 'Comb', desc: 'Sisir pencetak sumur.'}, {name: 'Electrode', desc: 'Elektroda listrik.'}, {name: 'Power supply', desc: 'Penyuplai daya.'}, {name: 'Buffer chamber', desc: 'Wadah buffer.'}]) },
  { id: 13, name: 'Spektrofotometer', jenis: 'Optik', img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 14, name: 'Microcentrifuge', jenis: 'Sampel', img: 'https://images.unsplash.com/photo-1628189852277-2273617be3dd?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 15, name: 'Vortex Mixer', jenis: 'Sampel', img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 16, name: 'Hot Air Oven', jenis: 'Sterilisasi', img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 17, name: 'Microhematocrit Centrifuge', jenis: 'Hematologi', img: 'https://images.unsplash.com/photo-1628189852277-2273617be3dd?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 18, name: 'Spektrofotometer Kimia Klinik', jenis: 'Kimia', img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 19, name: 'Analytical Balance', jenis: 'Kimia', img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' },
  { id: 20, name: 'Gel Documentation System', jenis: 'Molekuler', img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=600&q=80', desc: '', function: '', parts: '[]' }
  ];
  
  toolsData.forEach(t => appendObject_('tools', t, toolsSheet));

  const sopsData = [
  { id: 1, tool_id: 1, step_title: 'Persiapan Meja', content: 'Letakkan mikroskop pada meja yang datar dan stabil.' },
  { id: 2, tool_id: 1, step_title: 'Koneksi Listrik', content: 'Hubungkan kabel listrik.' },
  { id: 3, tool_id: 1, step_title: 'Pencahayaan', content: 'Nyalakan lampu mikroskop.' },
  { id: 4, tool_id: 1, step_title: 'Peletakan Preparat', content: 'Letakkan preparat pada meja objek.' },
  { id: 5, tool_id: 1, step_title: 'Lensa Terendah', content: 'Mulai dengan lensa objektif pembesaran rendah.' },
  { id: 6, tool_id: 1, step_title: 'Pengaturan Kasar', content: 'Atur fokus menggunakan pemutar kasar.' },
  { id: 7, tool_id: 1, step_title: 'Pengaturan Halus', content: 'Tajamkan gambar menggunakan pemutar halus.' },
  { id: 8, tool_id: 1, step_title: 'Pengaturan Cahaya', content: 'Atur intensitas cahaya dan diafragma.' },
  { id: 9, tool_id: 1, step_title: 'Pembesaran Lanjut', content: 'Jika diperlukan, pindahkan ke objektif dengan pembesaran lebih tinggi.' },
  { id: 10, tool_id: 1, step_title: 'Pengembalian Lensa', content: 'Setelah selesai, kembalikan objektif ke pembesaran rendah.' },
  { id: 11, tool_id: 1, step_title: 'Mematikan Alat', content: 'Matikan lampu dan cabut kabel listrik.' },
  { id: 12, tool_id: 1, step_title: 'Pembersihan', content: 'Bersihkan lensa dengan lens paper.' },
  { id: 13, tool_id: 2, step_title: 'Posisi Alat', content: 'Pastikan centrifuge berada pada permukaan datar.' },
  { id: 14, tool_id: 2, step_title: 'Pengecekan Rotor', content: 'Periksa rotor dan holder tabung.' },
  { id: 15, tool_id: 2, step_title: 'Memasukkan Sampel', content: 'Masukkan sampel ke dalam tabung yang sesuai.' },
  { id: 16, tool_id: 2, step_title: 'Keseimbangan', content: 'Seimbangkan tabung dengan volume dan berat yang sama.' },
  { id: 17, tool_id: 2, step_title: 'Peletakan Tabung', content: 'Letakkan tabung secara berhadapan pada rotor.' },
  { id: 18, tool_id: 2, step_title: 'Menutup Alat', content: 'Tutup centrifuge dengan rapat.' },
  { id: 19, tool_id: 2, step_title: 'Pengaturan', content: 'Atur kecepatan dan waktu sesuai pemeriksaan.' },
  { id: 20, tool_id: 2, step_title: 'Memulai Putaran', content: 'Tekan tombol start.' },
  { id: 21, tool_id: 2, step_title: 'Menunggu Berhenti', content: 'Tunggu rotor berhenti sepenuhnya.' },
  { id: 22, tool_id: 2, step_title: 'Membuka Tutup', content: 'Buka tutup centrifuge.' },
  { id: 23, tool_id: 2, step_title: 'Mengambil Tabung', content: 'Ambil tabung secara hati-hati.' },
  { id: 24, tool_id: 2, step_title: 'Pembersihan', content: 'Bersihkan alat setelah digunakan.' },
  { id: 25, tool_id: 3, step_title: 'Pemilihan Mikropipet', content: 'Pilih mikropipet sesuai rentang volume.' },
  { id: 26, tool_id: 3, step_title: 'Pengaturan Volume', content: 'Atur volume yang dibutuhkan.' },
  { id: 27, tool_id: 3, step_title: 'Pemasangan Tip', content: 'Pasang tip baru.' },
  { id: 28, tool_id: 3, step_title: 'First Stop', content: 'Tekan plunger sampai posisi first stop.' },
  { id: 29, tool_id: 3, step_title: 'Mencelupkan Tip', content: 'Celupkan ujung tip ke dalam cairan.' },
  { id: 30, tool_id: 3, step_title: 'Penghisapan Cairan', content: 'Lepaskan plunger secara perlahan.' },
  { id: 31, tool_id: 3, step_title: 'Mengangkat Tip', content: 'Angkat tip dari cairan.' },
  { id: 32, tool_id: 3, step_title: 'Menempelkan Wadah', content: 'Tempelkan tip pada dinding wadah tujuan.' },
  { id: 33, tool_id: 3, step_title: 'Second Stop', content: 'Tekan plunger sampai first stop kemudian second stop.' },
  { id: 34, tool_id: 3, step_title: 'Menarik Mikropipet', content: 'Tarik mikropipet dari wadah.' },
  { id: 35, tool_id: 3, step_title: 'Melepas Plunger', content: 'Lepaskan plunger.' },
  { id: 36, tool_id: 3, step_title: 'Membuang Tip', content: 'Buang tip menggunakan tip ejector.' },
  { id: 37, tool_id: 4, step_title: 'Cek Volume Air', content: 'Periksa volume air autoclave.' },
  { id: 38, tool_id: 4, step_title: 'Memasukkan Bahan', content: 'Masukkan alat atau bahan yang akan disterilkan.' },
  { id: 39, tool_id: 4, step_title: 'Batas Pengisian', content: 'Jangan mengisi chamber terlalu penuh.' },
  { id: 40, tool_id: 4, step_title: 'Menutup Rapat', content: 'Tutup autoclave dengan benar.' },
  { id: 41, tool_id: 4, step_title: 'Suhu dan Waktu', content: 'Tentukan suhu dan waktu sterilisasi.' },
  { id: 42, tool_id: 4, step_title: 'Parameter Umum', content: 'Umumnya sterilisasi dilakukan pada sekitar 121°C dengan tekanan yang sesuai prosedur laboratorium.' },
  { id: 43, tool_id: 4, step_title: 'Jalankan Siklus', content: 'Jalankan siklus sterilisasi.' },
  { id: 44, tool_id: 4, step_title: 'Tunggu Selesai', content: 'Tunggu proses selesai.' },
  { id: 45, tool_id: 4, step_title: 'Penurunan Tekanan', content: 'Pastikan tekanan turun hingga aman sebelum membuka tutup.' },
  { id: 46, tool_id: 4, step_title: 'Membuka Aman', content: 'Buka tutup perlahan dan menjauh dari arah uap.' },
  { id: 47, tool_id: 4, step_title: 'Sarung Tangan Panas', content: 'Gunakan sarung tangan tahan panas saat mengambil alat.' },
  { id: 48, tool_id: 4, step_title: 'Pembersihan', content: 'Bersihkan chamber setelah digunakan.' },
  { id: 49, tool_id: 5, step_title: 'Cek Kebersihan Area', content: 'Pastikan area BSC bersih.' },
  { id: 50, tool_id: 5, step_title: 'Nyalakan Blower', content: 'Nyalakan blower sesuai prosedur alat.' },
  { id: 51, tool_id: 5, step_title: 'Stabilisasi Udara', content: 'Biarkan aliran udara stabil.' },
  { id: 52, tool_id: 5, step_title: 'Disinfeksi Permukaan', content: 'Bersihkan permukaan kerja dengan disinfektan yang sesuai.' },
  { id: 53, tool_id: 5, step_title: 'Alat Diperlukan', content: 'Masukkan hanya alat yang diperlukan.' },
  { id: 54, tool_id: 5, step_title: 'Area Terbuka', content: 'Jangan menutup grille udara.' },
  { id: 55, tool_id: 5, step_title: 'Posisi Kerja', content: 'Kerjakan sampel pada area kerja yang direkomendasikan.' },
  { id: 56, tool_id: 5, step_title: 'Gerakan Tangan', content: 'Hindari gerakan tangan yang terlalu cepat.' },
  { id: 57, tool_id: 5, step_title: 'Pemisahan Area', content: 'Pisahkan area bersih dan area terkontaminasi.' },
  { id: 58, tool_id: 5, step_title: 'Pembuangan Limbah', content: 'Setelah selesai, buang limbah ke wadah yang sesuai.' },
  { id: 59, tool_id: 5, step_title: 'Pembersihan Ulang', content: 'Bersihkan permukaan kerja.' },
  { id: 60, tool_id: 5, step_title: 'Mematikan Blower', content: 'Biarkan blower bekerja beberapa saat sesuai SOP laboratorium sebelum dimatikan.' },
  { id: 61, tool_id: 6, step_title: 'Menyalakan Alat', content: 'Nyalakan analyzer.' },
  { id: 62, tool_id: 6, step_title: 'Cek Reagen', content: 'Periksa reagen dan waste container.' },
  { id: 63, tool_id: 6, step_title: 'Proses Startup', content: 'Lakukan startup sesuai petunjuk alat.' },
  { id: 64, tool_id: 6, step_title: 'Quality Control', content: 'Jalankan quality control bila diperlukan.' },
  { id: 65, tool_id: 6, step_title: 'Homogenisasi', content: 'Homogenkan sampel darah EDTA secara perlahan.' },
  { id: 66, tool_id: 6, step_title: 'Identifikasi', content: 'Identifikasi sampel.' },
  { id: 67, tool_id: 6, step_title: 'Posisi Pemeriksaan', content: 'Letakkan sampel pada posisi pemeriksaan.' },
  { id: 68, tool_id: 6, step_title: 'Proses Analisis', content: 'Jalankan proses analisis.' },
  { id: 69, tool_id: 6, step_title: 'Tunggu Hasil', content: 'Tunggu hasil muncul.' },
  { id: 70, tool_id: 6, step_title: 'Evaluasi Abnormal', content: 'Evaluasi flag atau hasil abnormal.' },
  { id: 71, tool_id: 6, step_title: 'Simpan Cetak', content: 'Simpan atau cetak hasil.' },
  { id: 72, tool_id: 6, step_title: 'Shutdown Alat', content: 'Lakukan shutdown dan cleaning sesuai SOP alat.' },
  { id: 73, tool_id: 7, step_title: 'Pembersihan Kamar', content: 'Bersihkan kamar hitung dan cover glass.' },
  { id: 74, tool_id: 7, step_title: 'Persiapan Sampel', content: 'Siapkan sampel sesuai pemeriksaan.' },
  { id: 75, tool_id: 7, step_title: 'Pasang Cover', content: 'Pasang cover glass.' },
  { id: 76, tool_id: 7, step_title: 'Masukkan Sampel', content: 'Masukkan sampel secara perlahan pada chamber.' },
  { id: 77, tool_id: 7, step_title: 'Cegah Gelembung', content: 'Hindari gelembung udara.' },
  { id: 78, tool_id: 7, step_title: 'Distribusi Sel', content: 'Diamkan sel agar tersebar merata.' },
  { id: 79, tool_id: 7, step_title: 'Letakkan di Mikroskop', content: 'Letakkan chamber pada mikroskop.' },
  { id: 80, tool_id: 7, step_title: 'Fokus Area', content: 'Fokuskan area grid.' },
  { id: 81, tool_id: 7, step_title: 'Hitung Sel', content: 'Hitung sel pada area yang ditentukan.' },
  { id: 82, tool_id: 7, step_title: 'Kalkulasi Konsentrasi', content: 'Hitung konsentrasi sel menggunakan rumus pemeriksaan yang sesuai.' },
  { id: 83, tool_id: 7, step_title: 'Pembersihan Akhir', content: 'Bersihkan chamber setelah digunakan.' },
  { id: 84, tool_id: 8, step_title: 'Menyalakan Alat', content: 'Nyalakan alat.' },
  { id: 85, tool_id: 8, step_title: 'Pengecekan Reagen', content: 'Periksa reagen.' },
  { id: 86, tool_id: 8, step_title: 'Cek Air Pencuci', content: 'Periksa air pencuci dan waste.' },
  { id: 87, tool_id: 8, step_title: 'Proses Startup', content: 'Jalankan startup.' },
  { id: 88, tool_id: 8, step_title: 'Kalibrasi dan QC', content: 'Lakukan kalibrasi atau QC sesuai kebutuhan.' },
  { id: 89, tool_id: 8, step_title: 'Identitas Pasien', content: 'Masukkan identitas pasien.' },
  { id: 90, tool_id: 8, step_title: 'Posisi Sampel', content: 'Letakkan sampel pada sample tray.' },
  { id: 91, tool_id: 8, step_title: 'Pilih Parameter', content: 'Pilih parameter pemeriksaan.' },
  { id: 92, tool_id: 8, step_title: 'Jalankan Analisis', content: 'Jalankan analisis.' },
  { id: 93, tool_id: 8, step_title: 'Cek Hasil', content: 'Periksa hasil dan flag.' },
  { id: 94, tool_id: 8, step_title: 'Simpan Data', content: 'Simpan hasil.' },
  { id: 95, tool_id: 8, step_title: 'Cleaning dan Shutdown', content: 'Lakukan cleaning dan shutdown.' },
  { id: 96, tool_id: 9, step_title: 'Menyalakan Alat', content: 'Nyalakan pH meter.' },
  { id: 97, tool_id: 9, step_title: 'Kalibrasi Buffer', content: 'Lakukan kalibrasi menggunakan buffer standar.' },
  { id: 98, tool_id: 9, step_title: 'Bilas Elektroda', content: 'Bilas elektroda dengan aquadest.' },
  { id: 99, tool_id: 9, step_title: 'Keringkan Perlahan', content: 'Keringkan perlahan tanpa menggosok elektroda.' },
  { id: 100, tool_id: 9, step_title: 'Pencelupan Sampel', content: 'Celupkan elektroda ke dalam sampel.' },
  { id: 101, tool_id: 9, step_title: 'Tunggu Stabil', content: 'Tunggu nilai stabil.' },
  { id: 102, tool_id: 9, step_title: 'Catat Hasil', content: 'Catat hasil.' },
  { id: 103, tool_id: 9, step_title: 'Bilas Kembali', content: 'Bilas kembali elektroda.' },
  { id: 104, tool_id: 9, step_title: 'Penyimpanan Elektroda', content: 'Simpan elektroda dalam larutan penyimpanan yang direkomendasikan.' },
  { id: 105, tool_id: 10, step_title: 'Master Mix', content: 'Siapkan master mix PCR sesuai protokol.' },
  { id: 106, tool_id: 10, step_title: 'Template DNA', content: 'Tambahkan template DNA.' },
  { id: 107, tool_id: 10, step_title: 'Masukkan Tabung', content: 'Masukkan campuran ke PCR tube.' },
  { id: 108, tool_id: 10, step_title: 'Tutup Rapat', content: 'Tutup tabung dengan rapat.' },
  { id: 109, tool_id: 10, step_title: 'Ke Thermal Cycler', content: 'Masukkan tabung ke thermal cycler.' },
  { id: 110, tool_id: 10, step_title: 'Atur Program', content: 'Atur program PCR.' },
  { id: 111, tool_id: 10, step_title: 'Tahapan PCR', content: 'Tentukan tahap denaturasi, annealing, dan extension.' },
  { id: 112, tool_id: 10, step_title: 'Jalankan Program', content: 'Jalankan program.' },
  { id: 113, tool_id: 10, step_title: 'Tunggu Selesai', content: 'Tunggu siklus PCR selesai.' },
  { id: 114, tool_id: 10, step_title: 'Ambil Produk', content: 'Ambil produk PCR.' },
  { id: 115, tool_id: 10, step_title: 'Pemeriksaan Lanjut', content: 'Lanjutkan pemeriksaan menggunakan elektroforesis atau metode deteksi yang sesuai.' },
  { id: 116, tool_id: 10, step_title: 'Pembersihan Area', content: 'Bersihkan area kerja setelah selesai.' },
  { id: 117, tool_id: 11, step_title: 'Siapkan Reagen', content: 'Siapkan reagen PCR.' },
  { id: 118, tool_id: 11, step_title: 'Tambahkan Sampel', content: 'Tambahkan sampel dan kontrol.' },
  { id: 119, tool_id: 11, step_title: 'Masukkan ke Tube', content: 'Masukkan campuran ke PCR tube atau plate.' },
  { id: 120, tool_id: 11, step_title: 'Tutup Benar', content: 'Tutup plate dengan benar.' },
  { id: 121, tool_id: 11, step_title: 'Masukkan ke Mesin', content: 'Masukkan ke Real-Time PCR.' },
  { id: 122, tool_id: 11, step_title: 'Pilih Metode', content: 'Pilih metode pemeriksaan.' },
  { id: 123, tool_id: 11, step_title: 'Target Fluoresensi', content: 'Tentukan target fluoresensi.' },
  { id: 124, tool_id: 11, step_title: 'Jalankan Amplifikasi', content: 'Jalankan proses amplifikasi.' },
  { id: 125, tool_id: 11, step_title: 'Evaluasi Kurva', content: 'Evaluasi amplification curve.' },
  { id: 126, tool_id: 11, step_title: 'Evaluasi Ct/Cq', content: 'Evaluasi Ct/Cq sesuai kriteria pemeriksaan.' },
  { id: 127, tool_id: 11, step_title: 'Simpan Hasil', content: 'Simpan hasil pemeriksaan.' },
  { id: 128, tool_id: 11, step_title: 'Bersihkan Area', content: 'Bersihkan area kerja.' },
  { id: 129, tool_id: 12, step_title: 'Persiapan Gel', content: 'Siapkan gel sesuai konsentrasi yang dibutuhkan.' },
  { id: 130, tool_id: 12, step_title: 'Tuang Cetakan', content: 'Tuang gel ke cetakan.' },
  { id: 131, tool_id: 12, step_title: 'Pasang Comb', content: 'Pasang comb.' },
  { id: 132, tool_id: 12, step_title: 'Tunggu Mengeras', content: 'Tunggu gel mengeras.' },
  { id: 133, tool_id: 12, step_title: 'Masukkan ke Chamber', content: 'Masukkan gel ke electrophoresis chamber.' },
  { id: 134, tool_id: 12, step_title: 'Tambahkan Buffer', content: 'Tambahkan buffer.' },
  { id: 135, tool_id: 12, step_title: 'Masukkan Sampel', content: 'Masukkan sampel dan marker ke sumur gel.' },
  { id: 136, tool_id: 12, step_title: 'Tutup Chamber', content: 'Tutup chamber.' },
  { id: 137, tool_id: 12, step_title: 'Hubungkan Daya', content: 'Hubungkan power supply.' },
  { id: 138, tool_id: 12, step_title: 'Atur Tegangan', content: 'Atur tegangan sesuai protokol.' },
  { id: 139, tool_id: 12, step_title: 'Jalankan Proses', content: 'Jalankan elektroforesis.' },
  { id: 140, tool_id: 12, step_title: 'Matikan Listrik', content: 'Matikan listrik sebelum membuka chamber.' },
  { id: 141, tool_id: 12, step_title: 'Visualisasikan', content: 'Visualisasikan hasil menggunakan sistem dokumentasi gel.' }
  ];
  
  sopsData.forEach(s => appendObject_('sops', s, sopsSheet));
}
function seedProducts() {
  const sheet = getSheet_('products');
  
  // Clear existing (excluding header)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  
  const productsData = [
    { id: 1, name: 'Object Glass - Box isi 72 pcs', price: 30000, img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 2, name: 'Cover Glass - Box isi 100 pcs', price: 50000, img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 3, name: 'Immersion Oil - Botol 100 mL', price: 375000, img: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 4, name: 'Blood Lancet - Box isi 100 pcs', price: 35000, img: 'https://images.unsplash.com/photo-1628189852277-2273617be3dd?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 5, name: 'EDTA Tube - Box isi 100 pcs', price: 175000, img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 6, name: 'Plain Tube - Box isi 100 pcs', price: 150000, img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 7, name: 'Sodium Citrate Tube - Box isi 100 pcs', price: 200000, img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 8, name: 'Capillary Tube - Box isi 100 pcs', price: 60000, img: 'https://images.unsplash.com/photo-1579154204601-e1588bc615d1?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 9, name: 'Pipette Tip Kuning - Pack isi 100 pcs', price: 55000, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 10, name: 'Pipette Tip Biru - Pack isi 100 pcs', price: 60000, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 11, name: 'Microtube 1,5 mL - Pack isi 100 pcs', price: 75000, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 12, name: 'Gloves Examination - Box isi 100 pcs', price: 75000, img: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 13, name: 'Masker Medis 3 Ply - Box isi 50 pcs', price: 35000, img: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 14, name: 'Alkohol Swab - Box isi 100 pcs', price: 30000, img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 15, name: 'Urine Strip 10 Parameter - Botol isi 100 test', price: 175000, img: 'https://images.unsplash.com/photo-1532187863486-abf92fbe0cfb?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 16, name: 'Larutan Turk - Botol 100 mL', price: 30000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 17, name: 'Larutan Hayem - Botol 100 mL', price: 40000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 18, name: 'Larutan Rees-Ecker - Botol 100 mL', price: 40000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 19, name: 'Brilliant Cresyl Blue / BCB - 1 Botol', price: 305000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 20, name: 'Giemsa Stain - Botol 100 mL', price: 200000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 21, name: 'EDTA 10% - Botol 100 mL', price: 105000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 22, name: 'Benedict - Botol 100 mL', price: 55000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 23, name: 'KOH 10% - Botol 100 mL', price: 40000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 24, name: 'McFarland Standard - 1 Botol', price: 20000, img: 'https://images.unsplash.com/photo-1614935151651-0bea6508ab53?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 25, name: 'Anti-A Blood Grouping - 1 Vial', price: 200000, img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 26, name: 'Anti-B Blood Grouping - 1 Vial', price: 200000, img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 27, name: 'Anti-D / Anti-Rh - 1 Vial', price: 225000, img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 28, name: 'Hemocytometer Improved Neubauer - 1 Set', price: 450000, img: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 29, name: 'Mikropipet Adjustable - 1 Unit', price: 1250000, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 },
    { id: 30, name: 'Tourniquet - 1 Pcs', price: 25000, img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=400&q=80', link: '', stock: 50 }
  ];
  
  productsData.forEach(p => appendObject_('products', p, sheet));
}
