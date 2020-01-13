var LoadSheet = function LoadSheet(opts) {
  if(!opts) opts = {};
  var nullfunc = function(){};
  if(!opts.errors) opts.errors = {};
  if(!opts.errors.badfile) opts.errors.badfile = nullfunc;
  if(!opts.errors.pending) opts.errors.pending = nullfunc;
  if(!opts.errors.failed) opts.errors.failed = nullfunc;
  if(!opts.errors.large) opts.errors.large = nullfunc;
  if(!opts.on) opts.on = {};
  if(!opts.on.workstart) opts.on.workstart = nullfunc;
  if(!opts.on.workend) opts.on.workend = nullfunc;
  if(!opts.on.sheet) opts.on.sheet = nullfunc;
  if(!opts.on.wb) opts.on.wb = nullfunc;

  // var rABS = typeof FileReader !== 'undefined' && FileReader.prototype && FileReader.prototype.readAsBinaryString;
  // 不使用readAsBinaryString,使用base64
  var rABS = typeof FileReader !== 'undefined' && FileReader.prototype && "";
  var useworker = typeof Worker !== 'undefined';
  var pending = false;
  function fixdata(data) {
    var o = "", l = 0, w = 10240;
    for(; l<data.byteLength/w; ++l)
      o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
    o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
    return o;
  }

  var last_wb;

  function to_json(workbook) {
    if(useworker && workbook.SSF) XLSX.SSF.load_table(workbook.SSF);
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {raw:false});
      if(roa.length > 0) result[sheetName] = roa;
    });
    return result;
  }

  function get_columns(sheet) {
    var val, rowObject, range, columnHeaders, emptyRow, C;
    range = XLSX.utils.decode_range(sheet["!ref"]);
    columnHeaders = [];
    for (C = range.s.c; C <= range.e.c; ++C) {
      val = sheet[XLSX.utils.encode_cell({c: C, r: range.s.r})];
      if(!val) continue;
      columnHeaders[C] = val.v;
    }
    return columnHeaders;
  }

  function choose_sheet(sheetidx) { process_wb(last_wb, sheetidx); }

  function process_wb(wb, size) {
    last_wb = wb;
    opts.on.wb(wb, size);
    var sheet = wb.SheetNames[0];
    var json = to_json(wb)[sheet];
    var cols = get_columns(wb.Sheets[sheet]);
    opts.on.sheet(json, cols, wb.SheetNames, choose_sheet, 0);
  }

  // progressbar.js@1.0.0 version is used
  // Docs: http://progressbarjs.readthedocs.org/en/1.0.0/
  var progressbar_setting = {
    strokeWidth: 4,
    easing: 'easeInOut',
    duration: 200,
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    svgStyle: {width: '100%', height: '100%'},
    text: {
      style: {
        // Text color.
        // Default: same as stroke color (options.color)
        color: '#999',
        position: 'absolute',
        right: '0',
        top: '0',
        padding: 0,
        margin: 0,
        transform: null
      },
      autoStyleContainer: false
    },
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'},
    step: (state, bar) => {
      bar.setText(Math.round(bar.value() * 100) + ' %');
      // console.log("[bar]"+bar.value());
    }
  };
  
  var barmonster = new ProgressBar.Line('#bar-monster', progressbar_setting);
  barmonster.opened = false;
  barmonster.done = false;
  
  var bareffect = new ProgressBar.Line('#bar-effect', progressbar_setting);
  bareffect.opened = false;
  bareffect.done = false;
  
  var barskill = new ProgressBar.Line('#bar-skill', progressbar_setting);
  barskill.opened = false;
  barskill.done = false;
  
  var barcard = new ProgressBar.Line('#bar-card', progressbar_setting);
  barcard.opened = false;
  barcard.done = false;
  
  var barstatus = new ProgressBar.Line('#bar-status', progressbar_setting);
  barstatus.opened = false;
  barstatus.done = false;
    
  function progress(pbar, pid, pvalue) {
    $(pid).show()
    pbar.set(pvalue);
  }
  
  function getLoadSheetPath() {
    var scripts = document.getElementsByTagName('script');
    var loadsheetPath;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf('loadsheet') != -1) {
        loadsheetPath = scripts[i].src.split('loadsheet.js')[0];
      }
    }
    return loadsheetPath;
  }
  
  // TODO: XMLHttpRequest download file and handle progressbar, then data sent to sheetjsw.js without absolute path.
  function handleFile(file, size, progress) {
    var readtype = {type: rABS ? 'binary' : 'base64' };
    readtype.cellDates = true;
    opts.on.workstart();
    var worker = new Worker(getLoadSheetPath() + 'xmlworker.js');
    worker.onmessage = function(evt) {
      switch (evt.data.t) {
        case "ready":
          // $(progressbar_id).show();
          progress ? progress(0) : "";
          break;
        case "progress":
          console.log("[progress]" + (evt.data.d / size));
          // progressbar.set(evt.data.d / size);
          progress ? progress(evt.data.d / size) : "";
          break;
        case "error":
          pending = false;
          console.error(evt.data.d);
          worker.postMessage({ t: "close" });
          break;
        case "xlsx":
          pending = false;
          opts.on.workend();
          process_wb(JSON.parse(evt.data.d), size);
          worker.postMessage({ t: "close" });
          break;
      }
    };
    worker.postMessage({b:readtype, t:'xlsx', file:file, size:size});
  }

  function handleMonsterFile() {
    handleFile("https://kakasfighter.github.io/db/demo_xml7_monster.xml?", 21587, progress.bind(null, barmonster, "#bar-monster"));
  }
  
  function handleEffectFile() {
    handleFile("https://kakasfighter.github.io/db/demo_xml4_effect.xml?", 37422, progress.bind(null, bareffect, "#bar-effect"));
  }
  
  function handleCardFile() {
    handleFile("https://kakasfighter.github.io/db/demo_xml1_card.xml?", 23646, progress.bind(null, barcard, "#bar-card"));
  }

  // 7750筆資料
  function handleRealCardFile() {
    handleFile(opts.update.card['url'], opts.update.card['size'], progress.bind(null, barcard, "#bar-card"));
  }
  
  // 7773筆資料
  function handleRealEffectFile() {
    handleFile(opts.update.effect['url'], opts.update.effect['size'], progress.bind(null, bareffect, "#bar-effect"));
  }
  
  // 549筆資料
  function handleRealSkillFile() {
    handleFile(opts.update.skill['url'], opts.update.skill['size'], progress.bind(null, barskill, "#bar-skill"));
  }

  // 6748筆資料
  function handleRealMonsterFile() {
    handleFile(opts.update.monster['url'], opts.update.monster['size'], progress.bind(null, barmonster, "#bar-monster"));
  }
  
  // 6748筆資料
  function handleRealStatusFile() {
    handleFile(opts.update.status['url'], opts.update.status['size'], progress.bind(null, barstatus, "#bar-status"));
  }
  
  // 新增直接處理monster,effect,card檔案的按鈕功能
  document.getElementById('demo-monster').addEventListener('click', handleMonsterFile, false);
  document.getElementById('demo-effect').addEventListener('click', handleEffectFile, false);
  document.getElementById('demo-card').addEventListener('click', handleCardFile, false);
  
  document.getElementById('real-monster').addEventListener('click', handleRealMonsterFile, false);
  document.getElementById('real-effect').addEventListener('click', handleRealEffectFile, false);
  document.getElementById('real-card').addEventListener('click', handleRealCardFile, false);
  
  // if(opts.update.card) handleCardFile();
  // if(opts.update.effect) handleEffectFile();
  // if(opts.update.monster) handleMonsterFile();
  
  if(opts.update.card['updatable']) handleRealCardFile();
  if(opts.update.effect['updatable']) handleRealEffectFile();
  if(opts.update.skill['updatable']) handleRealSkillFile();
  if(opts.update.monster['updatable']) handleRealMonsterFile();
  if(opts.update.status['updatable']) handleRealStatusFile();
};
