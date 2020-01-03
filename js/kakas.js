/**
 * @license
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Open database for reading table `card`, `monster`, `effect`, `Skill`.
 * @author KakaIdiotFan
 */
'use strict';

// Google JavaScript Style Guide: https://google.github.io/styleguide/jsguide.html
// Example: https://github.com/google/blockly/blob/master/core/block.js
// JSDoc: https://devdocs.io/jsdoc/
// https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler
// RequireJS: 自動管理載入js
// Node.js, RequireJS : https://github.com/samejack/blog-content/blob/master/Universal-plus.js

// Spectacular Test Runner for JavaScript: https://github.com/karma-runner/karma

/**
 * Flag to check if card image exists or not?
 */
const DEBUG_CHECK_IF_IMAGE_EXIST = false;

/* Update XLSX_* variable information manually after one week around patch */
const XLSX_CARD = {'name': 'card' , 'url': 'https://kakasfighter.github.io/db/Resources_xml1.xml', 'modifiedDate': "2019-04-29T07:21:45Z", 'size': 9885484, 'updatable': false};
const XLSX_EFFECT = {'name': 'effect', 'url': 'https://kakasfighter.github.io/db/Resources_xml4.xml' , 'modifiedDate': "2019-05-23T01:45:59Z", 'size': 5093442, 'updatable': false};
const XLSX_SKILL = {'name': 'Skill', 'url': 'https://kakasfighter.github.io/db/Resources_xml3.xml' , 'modifiedDate': "2018-12-06T09:45:14Z", 'size': 1022260, 'updatable': false};
const XLSX_MONSTER = {'name': 'monster', 'url': 'https://kakasfighter.github.io/db/Resources_xml7.xml' , 'modifiedDate': "2019-05-07T07:10:02Z", 'size': 7411934, 'updatable': false};

//@deprecated
// var _isCardTableUpdatable = true;
// var _isEffectTableUpdatable = true;
// var _isSkillTableUpdatable = true;
// var _isMonsterTableUpdatable = true;

/** Spinner shown on target */
var _target = document.body;
/** Spinner:讀取xml(card, effect, Skill, monster)時旋轉的UI */
var spinner = new Spinner();
/** Callback before xmlworker start */
var _workStart = function() { spinner.spin(_target); };
/** Callback after xmlworker end */
var _workEnd = function() { spinner.stop(); };
/** Alerts when processing a bad file */
var _badFile = function() {
  alertify.alert(
    'This file does not appear to be a valid Excel file.  If we made a mistake, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can take a look.', function(){});
};
/** @deprecated Not used */
var _pending = function() {
  alertify.alert('Please wait until the current file is processed.', function(){});
};
/** Alerts when file is too large */
var _large = function(len, cb) {
  alertify.confirm("This file is " + len + " bytes and may take a few moments.  Your browser may lock up during this process.  Shall we play?", cb);
};
/** Alerts when error occurs */
var _failed = function(e) {
  console.log(e, e.stack);
  alertify.alert(
    'We unfortunately dropped the ball here.  Please test the file using the <a href="/js-xlsx/">raw parser</a>.  If there are issues with the file processor, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can make things right.', function(){});
};

/** @deprecated Handsontable bold style. */
var boldRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  Handsontable.TextCell.renderer.apply(this, arguments);
  $(td).css({'font-weight': 'bold'});
};

/* $:JQuery/DOM cache */
/**
 * The window object, the root of DOM.
 * @type {jQuery}
 * @see {@link https://api.jquery.com/jQuery/} for jQuery API.
 * @see {@link https://api.jquery.com/Types/#jQuery} for jQuery object.
 */
var $window = null;

/** 
 * Set handsontable of "#hot-table" width.
 * @type {number}
 */
var availableWidth = 1000;

/** 
 * Set handsontable of "#hot-table" height.
 * @type {number}
 */
var availableHeight = 500;

/** Reset handsontable of "#hot-table" height, width */
var calculateHotTableSize = function () {
  availableWidth = Math.min($window.width() - 250, 1000);
  availableHeight = Math.min($window.height() - 100, 500);
};

/** 
 * Input a SQL statement, execute immediately.
 * @type {Element}
 */
var $sql = null;

/** 
 * Prepare a SQL statement from $sql with any error message if an error occurs.
 * @type {Element}
 */
var $sqlPrepareStatement = null;

/** 
 * Show a warning message if WebSQL is not supported.
 * @type {Element}
 */
var $sqlNotSupported = null;

/** 
 * Show the schema after an operation of create/insert/update a table.
 * @type {Element}
 */
var $schema = null;

/** 
 * Drop `monster` table and delete its meta data from `sheets`.
 * @type {Element}
 */
var $cleanMonsterTable = null;

/** 
 * Drop `effect` table and delete its meta data from `sheets`.
 * @type {Element}
 */
var $cleanEffectTable = null;

/** 
 * Drop `Skill` table and delete its meta data from `sheets`.
 * @type {Element}
 */
var $cleanSkillTable = null;

/** 
 * Drop `card` table and delete its meta data from `sheets`.
 * @type {Element}
 */
var $cleanCardTable = null;

/** 
 * Drop all tables from 'kaka' database.
 * @type {Element}
 */
var $cleanKakaDatabase = null;

/**
 * jQuery slects class 'race-monster-radio'.
 * @type {jQuery}
 */
var $raceMonsterRadio = null;

/**
 * jQuery slects id 'attack_type_wrap'.
 * @type {jQuery}
 */
var $attackTypeWrap = null;

/**
 * jQuery slects id 'orver-ir-wrap'.
 * @type {jQuery}
 */
var $overInitReadyWrap = null;

/**
 * jQuery slects input name 'race' with 'all' value.
 * @type {jQuery}
 */
var $raceAllRadio = null;

/**
 * jQuery slects input name 'init_ready' with 'all' value.
 * @type {jQuery}
 */
var $initReadyAllRadio = null;

/**
 * jQuery slects id 'hot-card', the card results matches user query.
 * @type {jQuery}
 */
var $cardSearchedResults = null;

/**
 * jQuery slects id 'search-card-name', get card name from user input.
 * @type {jQuery}
 */
var $searchCardName = null;

/**
 * Cache the last timeoutID, attempt to stop UI blocking after user continuously typing every character of card name.
 * @type {number}
 */
var $previousFilterTimeoutId = 0;

/** 
 * A database contains tables(`monster`, `effect`, `Skill`, `card`).
 * Maybe use IndexedDB(https://github.com/google/lovefield) in the future.
 * @type {!Database}
 * @deprecated Avoids Web SQL: https://developers.google.com/web/tools/lighthouse/audits/web-sql?hl=zh-tw
 */
var sqlDatabase = openDatabase('kaka', '1.0', '卡卡們的大亂鬥-卡片資料庫', 3 * 1024 * 1024);

/**
 * Record each row of `effect` table by 'EffectID'.
 * @dict
 * @type {!Object<number, Object>}
 */
var jsonEffect;

/**
 * Record each row of `Skill` table by 'ID'.
 * @dict
 * @type {!Object<number, Object>}
 */
var jsonSkill;

$(document).ready(function() {
  $window = $(window);
  $window.on('resize', calculateHotTableSize);
  $sql = document.getElementById('sql');
  $sql.oninput = querySheet;
  $sqlPrepareStatement = document.getElementById('sqlpre');
  $sqlNotSupported = document.getElementById('sqldiv');
  $schema = document.getElementById('schema');
  
  $cleanMonsterTable = document.getElementById('clean-monster')
  $cleanEffectTable = document.getElementById('clean-effect')
  $cleanSkillTable = document.getElementById('clean-skill')
  $cleanCardTable = document.getElementById('clean-card')
  $cleanKakaDatabase = document.getElementById('clean-db')

  $cleanMonsterTable.addEventListener('click', cleanMonsterTable, false);
  $cleanEffectTable.addEventListener('click', cleanEffectTable, false);
  $cleanSkillTable.addEventListener('click', cleanSkillTable, false);
  $cleanCardTable.addEventListener('click', cleanCardTable, false);
  $cleanKakaDatabase.addEventListener('click', cleanKakaDatabase, false);
  
  $raceMonsterRadio = $(".race-monster-radio");
  $attackTypeWrap = $("#attack_type_wrap");
  $overInitReadyWrap = $("#orver-ir-wrap");
  $raceAllRadio = $("input[name='race'][value='all']");
  $initReadyAllRadio = $("input[name='init_ready'][value='all']");
  
  $cardSearchedResults = $("#hot-card .card-line");
  $searchCardName = $("#search-card-name")[0];
});

/** 
 * Each element is an row of sql query results.
 * @type {Array<json>} 
 */
var __data = [];

/**
 * Show results after querying $sql statement in a handsontable.
 * @param {Array<json>} json The rows of result from querying a table.
 * @param {Array<string>} cols The column names of a table.
 * @see https://handsontable.com/docs/7.3.0/tutorial-introduction.html
 */
var _onsheet = function(json, cols) {
  $('#footnote').hide();
  if (!json) json = [];
  //console.log(json, cols);
  calculateHotTableSize();
  /* show handsontable */
  $("#hot-table").handsontable({
    data: json,
    startRows: 5,
    startCols: 3,
    fixedRowsTop: 0,
    rowHeaders: true,
    columns: cols.map(function(x) { return {data:x}; }),
    colHeaders: cols,
    //將第一行資料加上粗體
    // cells: function (r,c,p) {
    // if(r === 0) this.renderer = boldRenderer;
    // },
    columnSorting: {
      indicator: true
    },
    width: function () { return availableWidth; },
    height: function () { return availableHeight; },
    // fit table to the container
    stretchH: 'all'
  });
  __data = json;
  if (__data.length) $("#exporter").removeAttr('disabled');
};

/**
 * Export results from $sql to a xlsx file.
 */
function exportXlsx() {
  var workSheet = XLSX.utils.json_to_sheet(__data, {skipHeader:false});
  var workBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workBook, workSheet, 'Results');
  XLSX.writeFile(workBook, 'QueryResults.xlsx');
}

/**
 * Show results after querying $sql statement.
 * @param {SQLResultSet} data The result from querying $sql.
  */
function showSheet(data) {
  //console.log(data, data.rows, data.rows.length);
  if (!data || data.rows.length === 0) return;
  var r = data.rows.item(0);
  var cols = Object.keys(r);
  var json = [];
  for (var i = 0; i < data.rows.length; ++i) {
    r = data.rows.item(i);
    var o = {};
    cols.forEach(function(x) { o[x] = r[x]; });
    json.push(o);
  }
  //console.log(json, cols);
  _onsheet(json, cols);
}

/**
 * Query $sql statement and show in a handsontable.
 */
function querySheet() {
  $sqlPrepareStatement.classList.remove("error");
  $sqlPrepareStatement.classList.remove("info");
  var stmt = $sql.value;
  if (!stmt) return;
  if (stmt.indexOf(";") > -1) stmt = stmt.substr(0, stmt.indexOf(";"));
  $sqlPrepareStatement.innerText = stmt;
  sqlDatabase.transaction(function(tx) {
    tx.executeSql(stmt, [], function(tx, results) {
      $sqlPrepareStatement.classList.add("info");
      showSheet(results);
    }, function(tx, e) {
      $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
      $sqlPrepareStatement.classList.add("error");
    });
  });
}

/**
 *
 * @param {...DOMString} var_args Variadic sqlStatements executed in a transaction.
 */
function queryStmts(var_args) {
  $sqlPrepareStatement.classList.remove("error");
  $sqlPrepareStatement.classList.remove("info");
  $sqlPrepareStatement.innerText = Array.prototype.join.call(arguments, "\n");
  var args = arguments;
  sqlDatabase.transaction(function(tx) {
    Array.prototype.forEach.call(args, stmt => tx.executeSql(stmt, [], function(tx, results) {
      $sqlPrepareStatement.classList.add("info");
    }, function(tx, e) {
      $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
      $sqlPrepareStatement.classList.add("error");
    }));
  });
}


/**
 * A SQL statement to create `card` table.
 * @type {string}
 * @const
 */
const SQL_CREATE_CARD_TABLE =
  "CREATE TABLE IF NOT EXISTS`card` (`Name` TEXT, `ID` REAL PRIMARY KEY NOT NULL, `ResID` TEXT, `cardType` REAL, `Quality` REAL, `InitReady` REAL, `MonsterID` REAL, " + 
      "`SkillID` TEXT, `Des` TEXT, `NextCardID` REAL, `heChengRate` REAL, `returnRate` REAL, `file` TEXT, `CardsForBuilding` TEXT, `BGDes` TEXT, `Artist` TEXT, `Remarks` TEXT, " + 
      "`Race` REAL, `Auction Reserve Price` REAL, `Auction Ceiling Price` REAL, `Flag` REAL, `cardAbility1` TEXT, `cardAbility2` TEXT, `cardAbility3` TEXT, `cardAbility4` TEXT, `cardAbility5` TEXT, " +
      "`dummyattr1` TEXT, `dummyattr2` TEXT, `dummyattr3` TEXT, `dummyattr4` TEXT, `dummyattr5` TEXT);";

/**
 * A SQL statement to create `effect` table.
 * @type {string}
 * @const
 */
const SQL_CREATE_EFFECT_TABLE =
    "CREATE TABLE IF NOT EXISTS`effect` (`TypeID` REAL, `TypeDes` TEXT, `EffectID` REAL PRIMARY KEY NOT NULL, `Name` TEXT, `EffectDes` TEXT, " + 
      "`param1` REAL, `param2` REAL, `param3` REAL, `param4` REAL, `param5` REAL, `param6` REAL, `param7` REAL, `param8` REAL, `sourceview` TEXT, `destview` TEXT, " +
      "`dummyattr1` TEXT, `dummyattr2` TEXT, `dummyattr3` TEXT, `dummyattr4` TEXT, `dummyattr5` TEXT, `dummyattr6` TEXT);";

/**
 * A SQL statement to create `Skill` table.
 * @type {string}
 * @const
 */
const SQL_CREATE_SKILL_TABLE =
    "CREATE TABLE IF NOT EXISTS`skill` (`ID` REAL PRIMARY KEY NOT NULL, `SkillName` TEXT, `Des` TEXT, `IsEffect` REAL, `UseJob` REAL, `ServerClassID` REAL, `ClientViewClassID` REAL, " +
      "`SelectType` REAL, `TargetType` REAL, `Fly` REAL, `FlySpeed` REAL, `HaveDam` REAL, `DamType` REAL, `DamValue` REAL, `HaveCure` REAL, `CureValue` REAL, `StatusID` REAL, " + 
      "`StatueVeracity` REAL, `AreaID` REAL, `ActionType` REAL, `SkillView` REAL, `DamTypeForce` TEXT, `IsTemp` REAL, `StartX` REAL, `EndX` REAL, `dummyattr1` REAL, `ShoutName` TEXT, " + 
      "`dummyattr2` TEXT, `dummyattr3` TEXT, `dummyattr4` TEXT);";

/**
 * A SQL statement to create `monster` table.
 * @type {string}
 * @const
 */
const SQL_CREATE_MONSTER_TABLE = 
    "CREATE TABLE IF NOT EXISTS`monster` (`Name` TEXT, `ID` REAL PRIMARY KEY NOT NULL, `animateitem` TEXT, `monsterType` REAL, `Phyle` REAL, `HP` REAL, `Attack` REAL, `AIType` REAL, " +
      "`AttackType` REAL, `monsterAbility1` REAL, `monsterAbility2` REAL, `monsterAbility3` REAL, `monsterAbility4` REAL, `monsterAbility5` REAL, `normalSkillID` REAL, " + 
      "`Unique` REAL, `Speed` REAL, `Aura` TEXT, `MoveStyle` TEXT, `IsTask` TEXT, `Phyle2` REAL);";


/**
 * The index to get column name of table `card`, `effect`, `Skill`, `monster` from CARD_ATTRIBUTES, EFFECT_ATTRIBUTES, SKILL_ATTRIBUTES, MONSTER_ATTRIBUTES.
 * @type {number}
 * @const
 */
const ATTRIBUTE_NAME = 0;

/**
* The index to get column type of table `card`, `effect`, `Skill`, `monster` from CARD_ATTRIBUTES, EFFECT_ATTRIBUTES, SKILL_ATTRIBUTES, MONSTER_ATTRIBUTES.
 * @type {number}
 * @const
 */
const ATTRIBUTE_TYPE = 1;

/**
 * The attributes of the table `card` define the column name and its type.
 * @type {Array<Array<string, string>>}
 * @const
 */
const CARD_ATTRIBUTES = [
  ["`Name`", "TEXT"],
  ["`ID`", "REAL"],
  ["`ResID`", "TEXT"],
  ["`cardType`", "REAL"],
  ["`Quality`", "REAL"],
  ["`InitReady`", "REAL"],
  ["`MonsterID`", "REAL"],
  ["`SkillID`", "TEXT"],
  ["`Des`", "TEXT"],
  ["`NextCardID`", "REAL"],
  ["`heChengRate`", "REAL"],
  ["`returnRate`", "REAL"],
  ["`file`", "TEXT"],
  ["`CardsForBuilding`", "TEXT"],
  ["`BGDes`", "TEXT"],
  ["`Artist`", "TEXT"],
  ["`Remarks`", "TEXT"],
  ["`Race`", "REAL"],
  ["`Auction Reserve Price`", "REAL"],
  ["`Auction Ceiling Price`", "REAL"],
  ["`Flag`", "REAL"],
  ["`cardAbility1`", "TEXT"],
  ["`cardAbility2`", "TEXT"],
  ["`cardAbility3`", "TEXT"],
  ["`cardAbility4`", "TEXT"],
  ["`cardAbility5`", "TEXT"],
  // 不知道這些欄位功用dummyattr5:進階可能的卡片ID?
  ["`dummyattr1`", "TEXT"],
  ["`dummyattr2`", "TEXT"],
  ["`dummyattr3`", "TEXT"],
  ["`dummyattr4`", "TEXT"],
  ["`dummyattr5`", "TEXT"]
];

/**
 * The attributes of the table `effect` define the column name and its type.
 * @type {Array<Array<string, string>>}
 * @const
 */
const EFFECT_ATTRIBUTES = [
  ["`TypeID`", "REAL"],
  ["`TypeDes`", "TEXT"],
  ["`EffectID`", "REAL"],
  ["`Name`", "TEXT"],
  ["`EffectDes`", "TEXT"],
  ["`param1`", "REAL"],
  ["`param2`", "REAL"],
  ["`param3`", "REAL"],
  ["`param4`", "REAL"],
  ["`param5`", "REAL"],
  ["`param6`", "REAL"],
  ["`param7`", "REAL"],
  ["`param8`", "REAL"],
  ["`sourceview`", "TEXT"],
  ["`destview`", "TEXT"],
  // 不知道這些欄位功用
  ["`dummyattr1`", "TEXT"],
  ["`dummyattr2`", "TEXT"],
  ["`dummyattr3`", "TEXT"],
  ["`dummyattr4`", "TEXT"],
  ["`dummyattr5`", "TEXT"],
  ["`dummyattr6`", "TEXT"]
];

/**
 * The attributes of the table `Skill` define the column name and its type.
 * @type {Array<Array<string, string>>}
 * @const
 */
const SKILL_ATTRIBUTES = [
  ["`ID`", "REAL"],
  ["`SkillName`", "TEXT"],
  ["`Des`", "TEXT"],
  ["`IsEffect`", "REAL"],
  ["`UseJob`", "REAL"],
  ["`ServerClassID`", "REAL"],
  ["`ClientViewClassID`", "REAL"],
  ["`SelectType`", "REAL"],
  ["`TargetType`", "REAL"],
  ["`Fly`", "REAL"],
  ["`FlySpeed`", "REAL"],
  ["`HaveDam`", "REAL"],
  ["`DamType`", "REAL"],
  ["`DamValue`", "REAL"],
  ["`HaveCure`", "REAL"],
  ["`CureValue`", "REAL"],
  ["`StatusID`", "REAL"],
  ["`StatueVeracity`", "REAL"],
  ["`AreaID`", "REAL"],
  ["`ActionType`", "REAL"],
  ["`SkillView`", "REAL"],
  ["`DamTypeForce`", "TEXT"],
  ["`IsTemp`", "REAL"],
  ["`StartX`", "REAL"],
  ["`EndX`", "REAL"],
  //自己猜測欄位
  ["`dummyattr1`", "REAL"],
  ["`ShoutName`", "TEXT"],
  ["`dummyattr2`", "TEXT"],
  ["`dummyattr3`", "TEXT"],
  ["`dummyattr4`", "TEXT"],
  ["`dummyattr5`", "TEXT"]
];

/**
 * The attributes of the table `monster` define the column name and its type.
 * @type {Array<Array<string, string>>}
 * @const
 */
const MONSTER_ATTRIBUTES = [
  ["`Name`", "TEXT"],
  ["`ID`", "REAL"],
  ["`animateitem`", "TEXT"],
  ["`monsterType`", "REAL"],
  ["`Phyle`", "REAL"],
  ["`HP`", "REAL"],
  ["`Attack`", "REAL"],
  ["`AIType`", "REAL"],
  ["`AttackType`", "REAL"],
  ["`monsterAbility1`", "REAL"],
  ["`monsterAbility2`", "REAL"],
  ["`monsterAbility3`", "REAL"],
  ["`monsterAbility4`", "REAL"],
  ["`monsterAbility5`", "REAL"],
  ["`normalSkillID`", "REAL"],
  ["`Unique`", "REAL"],
  ["`Speed`", "REAL"],
  ["`Aura`", "TEXT"],
  ["`MoveStyle`", "TEXT"],
  ["`IsTask`", "TEXT"],
  ["`Phyle2`", "REAL"]
];

// 不需要Promise,故不採用: https://github.com/oskarer/websql-promisified/ errorCallback, successCallback in executeSql
// 使用Promise會需要同步,除非在webworker中執行,不然會卡住UI

/**
 * Build a table from a worksheet with the according SQL statements and attributes.
 * @param {!XLSX.WorkSheet} workSheet The worksheet contains sheetName sheet to build a table.
 * @param {!string} sheetName The name of the sheet, also the table.
 * @param {!} range The range of the sheet.
 * @param {!SQLTransaction} tx The transaction object executes sql.
 * @param {!string} sql The SQL statement builds sheetName table.
 * @param {!Array<Array<string, string>>} attributes The pair <column name, column type> of attributes build a query statement.
 */
function buildtable(workSheet, sheetName, range, tx, sql, attributes) {
  tx.executeSql(sql, []);

  //range.s.r+1 -> range.s.r+2:避免插入卡牌header到資料庫中
  
  /* update schema */
  $schema.innerHTML += "<h2>`" + sheetName + "`</h2>";
  var ss = "";
  attributes.forEach(function(attr) {
    if (attr[ATTRIBUTE_NAME]) ss += "`" + attr + "`<br />";
  });
  $schema.innerHTML += "<h3>" + ss + "</h3>";

  /* insert data */
  for (var R = range.s.r + 2; R <= range.e.r; ++R) {
    var stmt = "";
    var fields = [], values = [];
    for (var C = range.s.c; C <= range.e.c; ++C) {
      var cell = workSheet[XLSX.utils.encode_cell({ c: C, r: R })];
      if (!cell) continue;
      //輸出檢查哪個欄位超過範圍:
      //console.log([C, range.e.c, R, range.e.r], XLSX.utils.encode_cell({ c: C, r: R }), attributes[C - range.s.c], cell);
      fields.push(attributes[C - range.s.c][ATTRIBUTE_NAME]);
      var val = cell.v;
      switch (attributes[C - range.s.c][ATTRIBUTE_TYPE]) {
        case "REAL":
          if (cell.t == "b" || typeof val == "boolean") {
            val = +val;
          } else {
            val = '"' + val.toString().replace(/"/g, '""') + '"';
          }
          break;
        default:
          val = '"' + val.toString().replace(/"/g, '""') + '"';
      }
      values.push(val);
    }
    stmt = "INSERT OR IGNORE INTO `" + sheetName + "` (" + fields.join(", ") + ") VALUES (" + values.join(",") + ");";
    doQuery(tx, stmt, [], null);
  }
}

/**
 * Execute a SQL statement in a transaction.
 * @param {!SQLTransaction} tx The transaction object executes sql.
 * @param {!string} query The SQL statement.
 * @param {?Array<number|string>} values The '?' in query.
 * @param {?Function} successHandler The callback after success to execute query.
 */
function doQuery(tx, query, values, successHandler) {
  tx.executeSql(query, values, successHandler, errorHandler);
  function errorHandler(transaction, error) {
    console.log("Query error: ", error.message, " in ", query);
  }
}

/**
 * Build a table with its sheet name from worksheet and record its meta data(modified date, xlsx file size) into `sheets` table.
 * @param {!XLSX.WorkSheet} workSheet The worksheet contains raw data and column name which help build a table in Web SQL.
 * @param {!string} sheetName The name of the worksheet.
 * @param {!string} modifiedDate The modified date of the worksheet.
 * @param {!number} size The size of the xlsx file including the worksheet.
 */
function buildSheet(workSheet, sheetName, modifiedDate, size) {
  // 對應xml中<DocumentProperties><LastSaved>2019-05-23T01:45:59Z</LastSaved></DocumentProperties>
  console.log('Table(`'+ sheetName + '`) ModifiedDate:' + modifiedDate + ', worksheet:', workSheet);
  
  /* Get sheet range */
  if (!workSheet || !workSheet['!ref']) return;
  var range = XLSX.utils.decode_range(workSheet['!ref']);
  if (!range || !range.s || !range.e || range.s > range.e) return;
  //var Row = range.s.r, Col = range.s.c;
  console.log('Table(`'+ sheetName + '`) range:', range);
  
  sqlDatabase.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS `sheets` (`Name` TEXT PRIMARY KEY NOT NULL, `ModifiedDate` TEXT, `Size` REAL)", [], function(tx, results) {
      console.log('Table(`'+ sheetName + '`) Create TABLE `sheets`');
      //console.log(results);
    }, function() {
      console.log('Table(`'+ sheetName + '`) Error:Create TABLE `sheets`');
    });
    
    switch(sheetName) {
      case "card":
        buildtable(workSheet, sheetName, range, tx, SQL_CREATE_CARD_TABLE, CARD_ATTRIBUTES);
        break;
      case "effect":
        buildtable(workSheet, sheetName, range, tx, SQL_CREATE_EFFECT_TABLE, EFFECT_ATTRIBUTES);
        setJsonEffect(tx);
        break;
      case "Skill":
        buildtable(workSheet, sheetName, range, tx, SQL_CREATE_SKILL_TABLE, SKILL_ATTRIBUTES);
        setJsonSkill(tx);
        break;
      case "monster":
        buildtable(workSheet, sheetName, range, tx, SQL_CREATE_MONSTER_TABLE, MONSTER_ATTRIBUTES);
        break;
      default:
        console.log('Table(`'+ sheetName + '`) unkown table name');
    }
    // TODO: Update modifieddate,size
    // select * from `sheets` where size > 22000
    // select * from `sheets` where ModifiedDate > '2017-05-07T07:10:01Z'
    // INSERT INTO `sheets` (`Name`, `ModifiedDate`, `Size`) VALUES ("card", "2014-05-07T07:10:01Z", 9527) ON DUPLICATE KEY UPDATE ModifiedDate="2014-05-07T07:10:01Z", Size=9527
    // INSERT INTO `sheets` (`Name`, `ModifiedDate`, `Size`) VALUES ("card", "2014-05-07T07:10:01Z", 9527) ON CONFLICT(`Name`) DO UPDATE SET ModifiedDate="2014-05-07T07:10:01Z", Size=9527;
    // INSERT OR REPLACE INTO `sheets` (`Name`, `ModifiedDate`, `Size`) VALUES ("card", "2014-05-07T07:10:01Z", 9527)
    // 上面無法適用:只能使用下面的組合功能
    // INSERT OR IGNORE INTO `sheets` (`Name`, `ModifiedDate`, `Size`) VALUES ("card", "2014-05-07T07:10:01Z", 9527)
    // UPDATE `sheets` SET ModifiedDate="2014-05-07T07:10:01Z", Size=9527 WHERE Name="card";

    // -- Try to update any existing row
    // UPDATE `sheets` SET ModifiedDate="2014-05-07T07:10:01Z", Size=9527 WHERE name='card';
    // -- If no update happened (i.e. the row didn't exist) then insert one
    //INSERT INTO `sheets` (name, ModifiedDate, Size) SELECT 'card', "2014-05-07T07:10:01Z", 9527 WHERE (Select Changes() = 0);

    tx.executeSql('UPDATE `sheets` SET ModifiedDate=?, Size=? WHERE name=?;', [modifiedDate, size, sheetName], function() {}, function(tx, error) {
      console.log('Table(`'+ sheetName + '`) UPDATE error');
      console.log(arguments);
    });

    tx.executeSql('INSERT OR IGNORE INTO `sheets` (name, ModifiedDate, Size) SELECT ?, ?, ? WHERE (Select Changes() = 0);', [sheetName, modifiedDate, size], function() {}, function(tx, error) {
      console.log('Table(`'+ sheetName + '`) INSERT error');
      console.log(arguments);
    });
  }, function(tx, error) {
    console.log('Table(`'+ sheetName + '`) query ModifiedDate fails');
    console.log(arguments);
  });
}
  
// LoadSheet(_onwb)::opts.on.wb() -> handleWorkBook(wb) -> buildSheet(wb...), querySheet()-> showSheet() -> _onsheet
/**
 * Load the first work sheet from the work book, create a table and insert data according to work sheet name and its content.
 * @param {!XLSX.WorkBook} workBook The workbook transforms to a table in Web SQL.
 * @param {number} size The size of xlsx file.
 */
function handleWorkBook(workBook, size) {
  $schema.innerHTML = "";
  //$sql.oninput = querySheet;
  //$sexqls = document.getElementById('sexqls');
  if (typeof openDatabase === 'undefined') {
    $sqlNotSupported.hidden = false;
    $sqlNotSupported.innerHTML = '<div class="error"><b>*** WebSQL not available.  Consider using Chrome or Safari ***</b></div>';
    return;
  }
  $sql.disabled = true;
  if (workBook.Sheets && workBook.Sheets.Data && workBook.Sheets.Metadata) {
    $sql.value = "SELECT Format, Importance as Priority, Data.Code, css_class FROM Data JOIN Metadata ON Metadata.code = Data.code WHERE Importance < 3";
  } else {
    $sql.value = "SELECT * FROM `" + workBook.SheetNames[0] + "` LIMIT 30";
  }
  // create table and insert data
  workBook.SheetNames.forEach(function(sheetName) { 
    buildSheet(workBook.Sheets[sheetName], sheetName, workBook.Props.ModifiedDate, size); 
  });
  querySheet();
  $sql.disabled = false;
}

/**
 * Called in LoadSheet(...).
 * @param {!XLSX.WorkBook} workBook The workbook transforms to a table in Web SQL.
 * @param {number} size The size of xlsx file.
 */
var _onwb = function(workBook, size) {
  handleWorkBook(workBook, size);
}

// TODO: LoadSheet() contain XLSX_CARD, ... to change handleRealCardFile() parameters for url, size,...
// TODO:callback hell -> Use async, await, Promise
// TODO: set dates and size to a meaningful global variable.
function checkLatestXml() {
  // 1.檢查資料庫中的sheets關於卡片/效果/怪物的metadata,日期是否過期
  sqlDatabase.transaction(function(tx) {
    tx.executeSql('SELECT Name, ModifiedDate, Size FROM `sheets`;', [],
      function(tx, results) {
        if(results.rows.length > 0) {
          console.log("Table `sheets` >0:", results);
          for (var i=0; i < results.rows.length; i++) {
            switch (results.rows[i]["Name"]) {
              case XLSX_CARD['name']/*"card"*/:
                if (XLSX_CARD['modifiedDate'] <= results.rows[i]["ModifiedDate"]/* && 9885484 > results.rows[i]["Size"]*/) {
                  console.log("Table `card` is the latest version");
                  XLSX_CARD['updatable'] = false;
                }
                break;
              case XLSX_EFFECT['name']/*"effect"*/:
                if (XLSX_EFFECT['modifiedDate'] <= results.rows[i]["ModifiedDate"]/* && 5093442 > results.rows[i]["Size"]*/) {
                  console.log("Table `effect` is the latest version");
                  XLSX_EFFECT['updatable'] = false;
                  setJsonEffect(tx);
                }
                break;
              case XLSX_SKILL['name']/*"Skill"*/:
                if (XLSX_SKILL['modifiedDate'] <= results.rows[i]["ModifiedDate"]/* && 5093442 > results.rows[i]["Size"]*/) {
                  console.log("Table `skill` is the latest version");
                  XLSX_SKILL['updatable'] = false;
                  setJsonSkill(tx);
                }
                break;
              case XLSX_MONSTER['name']/*"monster"*/:
                if (XLSX_MONSTER['modifiedDate'] <= results.rows[i]["ModifiedDate"]/* && 7411934 > results.rows[i]["Size"]*/) {
                  console.log("Table `monster` is the latest version");
                  XLSX_MONSTER['updatable'] = false;
                }
                break;
            }
          }
        } else {
          console.log("Table `sheets` !>0:", results);
        }
        LoadSheet({
          update: {
            card: XLSX_CARD,
            effect: XLSX_EFFECT,
            skill: XLSX_SKILL,
            monster: XLSX_MONSTER,
          },
          on: {
            workstart: _workStart, /* perfect time to start a spinner */ 
            workend: _workEnd, /* perfect time to stop a spinner */ 
            sheet: _onsheet, /* callback with processed worksheet data */ 
            wb: _onwb, /* first callback with workbook */
          },
          errors: {
            badfile: _badFile, /* file is not actually a spreadsheet */
            pending: _pending, /* second workbook requested while first is processing */
            failed: _failed, /* encountered an error */
            large: _large, /* give an opportunity to stop if file is too large */ 
          }
        });
      }, function(tx, error) {
        console.log("checkLatestXml error: ", error, "Not found tables, update all now!");
        XLSX_CARD['updatable'] = true;
        XLSX_EFFECT['updatable'] = true;
        XLSX_SKILL['updatable'] = true;
        XLSX_MONSTER['updatable'] = true;
        LoadSheet({
          update: {
            card: XLSX_CARD,
            effect: XLSX_EFFECT,
            skill: XLSX_SKILL,
            monster: XLSX_MONSTER,
          },
          on: {
            workstart: _workStart, /* perfect time to start a spinner */ 
            workend: _workEnd, /* perfect time to stop a spinner */ 
            sheet: _onsheet, /* callback with processed worksheet data */ 
            wb: _onwb, /* first callback with workbook */
          },
          errors: {
            badfile: _badFile, /* file is not actually a spreadsheet */
            pending: _pending, /* second workbook requested while first is processing */
            failed: _failed, /* encountered an error */
            large: _large, /* give an opportunity to stop if file is too large */ 
          }
        });
    });
  });
}

checkLatestXml();

/**
 * Delete monster table for testing update it automatically.
 */
function cleanMonsterTable() {
  queryStmts('Drop TABLE monster', 'DELETE FROM `sheets` WHERE Name = "monster"');
}

/**
 * Delete effect table for testing update it automatically.
 */
function cleanEffectTable() {
  queryStmts('Drop TABLE effect', 'DELETE FROM `sheets` WHERE Name = "effect"');
}

/**
 * Delete Skill table for testing update it automatically.
 */
function cleanSkillTable() {
  queryStmts('Drop TABLE Skill', 'DELETE FROM `sheets` WHERE Name = "Skill"');
}

/**
 * Delete card table for testing update it automatically.
 */
function cleanCardTable() {
  queryStmts('Drop TABLE card', 'DELETE FROM `sheets` WHERE Name = "card"');
}

/**
 * Delete all table for testing update all automatically.
 */
function cleanKakaDatabase() {
  queryStmts('Drop TABLE sheets', 'Drop TABLE card', 'Drop TABLE effect', 'Drop TABLE Skill', 'Drop TABLE monster');
}

$(".sql-btn").on('click', function() {
  $sql.disabled = true;
  $sql.value = $( this ).siblings(".sql-stmt").text();
  querySheet();
  //$sql.oninput = querySheet;
  $sql.disabled = false;
});

$(".sql-btn-monster").on('click', function() {
  $sql.disabled = true;
  var monster_item = undefined;
  if (monster_item = $( this ).siblings("#monster-id")[0]) {
    $sql.value = "SELECT * FROM `card`, `monster` WHERE monster.id = " + monster_item.value + " AND card.id = monster.id";
  } else if (monster_item = $( this ).siblings("#monster-name")[0]) {
    $sql.value = "SELECT * FROM 'card' as c, `monster` as m WHERE  m.id = c.id  AND c.name LIKE '%" + monster_item.value + "%'";
  } else {
    console.log("No such element");
  }
  querySheet();
  //$sql.oninput = querySheet;
  $sql.disabled = false;
});

/**
 * Set card ability name and its description from `effect` table.
 * @param {!json} card The row of `card` Table matches user search condition.
 * @param {!string} abilityId One of the column name (cardAbility1, ..., cardAbility5) of `card` Table, (monsterAbility1, ..., monsterAbility5) of `monster` Table.
 */
function setCardAbility(card, abilityId) {
  if (card[abilityId]) {
    if (jsonEffect[card[abilityId]] && jsonEffect[card[abilityId]]["Name"]) {
      card[abilityId+"name"] = jsonEffect[card[abilityId]]["Name"];
      card[abilityId+"des"] = jsonEffect[card[abilityId]]["EffectDes"];
    } else {
      console.log("[Warning]Not found effect id:", card[abilityId], card);
    }
  }
}

/**
 * Set card normal skill name and its description from `Skill` table.
 * @param {!json} card The row of `card` Table matches user search condition.
 * @param {!string} normalSkillId The column name 'normalSkillID' of `card` Table.
 */
function setCardNormalSkill(card, normalSkillId) {
  if (card[normalSkillId]) {
    if (jsonSkill[card[normalSkillId]]) {
      card[normalSkillId+"name"] = jsonSkill[card[normalSkillId]]["SkillName"];
      card[normalSkillId+"des"] = jsonSkill[card[normalSkillId]]["Des"];
    } else {
      console.log("[Warning]Not found skill id:", card[normalSkillId], card);
    }
  }
}

/**
 * Set card abilitiy names and its description.
 * @param {!json} jsonCard The rows of join `card` and `monster` table with user search conditions.
 */
function setCardsDescription(jsonCard) {
  jsonCard.forEach(function(card) {
    setCardNormalSkill(card, 'normalSkillID');
    setCardAbility(card, 'cardAbility1');
    setCardAbility(card, 'cardAbility2');
    setCardAbility(card, 'cardAbility3');
    setCardAbility(card, 'cardAbility4');
    setCardAbility(card, 'cardAbility5');
    setCardAbility(card, 'monsterAbility1');
    setCardAbility(card, 'monsterAbility2');
    setCardAbility(card, 'monsterAbility3');
    setCardAbility(card, 'monsterAbility4');
    setCardAbility(card, 'monsterAbility5');
    // console.log(card);
  });
  //console.log(jsonCard);
}

/**
 * Transform the results into json type.
 * @param {!SQLResultSet} results The results from executeSql.
 * @return {!json}
 */
function getJsonResult(results) {
  // console.log(results, results.rows, results.rows.length);
  if (!results || results.rows.length === 0) return;
  var r = results.rows.item(0);
  var cols = Object.keys(r);
  var json = [];
  for (var i = 0; i < results.rows.length; ++i) {
    r = results.rows.item(i);
    var o = {};
    cols.forEach(function(x) { o[x] = r[x]; });
    json.push(o);
  }
  //console.log(json,cols);
  return json;
}

/**
 * Transform the results into json and each element mapped by 'EffectID' key of `effect` table.
 * @param {!SQLResultSet} results The results from executeSql.
 */
function getEffectJsonResult(results) {
  // console.log(results, results.rows, results.rows.length);
  if (!results || results.rows.length === 0) return;
  var r = results.rows.item(0);
  var cols = Object.keys(r);
  var json = [];
  for (var i = 0; i < results.rows.length; ++i) {
    r = results.rows.item(i);
    var o = {};
    cols.forEach(function(x) { o[x] = r[x]; });
    json[o['EffectID']] = o;
  }
  //console.log(json,cols);
  return json;
}


/**
 * Load all fields of `effect` table into 'jsonEffect' variable.
 * @param {!SQLTransaction} tx The transaction object executes sql.
 */
function setJsonEffect(tx) {
  var stmt = "SELECT * FROM `effect`";
  tx.executeSql(stmt, [], function(tx, results) {
    jsonEffect = getEffectJsonResult(results);
  }, function(tx, e) {
    $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
    $sqlPrepareStatement.classList.add("error");
  });
}

/**
 * Transform the results into json and each element mapped by 'ID' key of `Skill` table.
 * @param {!SQLResultSet} results The results from executeSql.
 */
function getSkillJsonResult(results) {
  // console.log(results, results.rows, results.rows.length);
  if (!results || results.rows.length === 0) return;
  var r = results.rows.item(0);
  var cols = Object.keys(r);
  var json = [];
  for (var i = 0; i < results.rows.length; ++i) {
    r = results.rows.item(i);
    var o = {};
    cols.forEach(function(x) { o[x] = r[x]; });
    json[o['ID']] = o;
  }
  //console.log(json,cols);
  return json;
}

/**
 * Load all fields of `Skill` table into 'jsonSkill' variable.
 * @param {!SQLTransaction} tx The transaction object executes sql.
 */
function setJsonSkill(tx) {
  var stmt = "SELECT * FROM `Skill`";
  tx.executeSql(stmt, [], function(tx, results) {
    jsonSkill = getSkillJsonResult(results);
  }, function(tx, e) {
    $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
    $sqlPrepareStatement.classList.add("error");
  });
}

/**
 * Search card by its id and present it in html.
 * @param {!number} cardId The card ID corresponds to id of `card`, `monster` table.
 */
function searchCardById(cardId) {
  var stmt = "SELECT * FROM `card`, `monster` WHERE monster.id = ? AND card.id = monster.id";
  sqlDatabase.transaction(function(tx) {
    tx.executeSql(stmt, [cardId], function(tx, results) {
      var jsonCard = getJsonResult(results);
      setCardsDescription(jsonCard);
      //createSearchedCards(jsonCard, createMonsterItem);
      var cards = "";
      var smallCards = "";
      jsonCard.forEach(function(c) {
        if (c) {
          cards += createMonsterItem(c);
          smallCards += createCardSmallItem(c);
        }
      });
      $('#hot-single-card').empty();
      $('#hot-single-card').append(`
<div id="my-single-card-big" class="card-table">
  <div class="row mb-3">
    <div class="col unit-title">
      <div class="m-1" title="收尋結果">收尋結果<span class="group-name gold-f">【官方連結】 <a href="https://nothing/detail.php?id=6666" class="text-white" target="_blank"><u>卡包名稱</u></a></span></div>
    </div>
  </div>
  <div class="row mb-3">
${cards}
  </div><!--row end-->
</div><!--card-table end-->
<div id="my-single-card-small" class="col-auto">
  <div id="my-card-boad">
    <div class="row" id="my-card-list">
${smallCards}
    </div><!--row end-->
  </div><!--my-card-boad end-->
</div><!--my-card end-->
      `);
    }, function(tx, e) {
      $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
      $sqlPrepareStatement.classList.add("error");
    });
  });
}

/**
 * Search skill cards and present it in html.
 * @param {string} condition The SQL condition is composed of card attributes(name, job, ...)
 */
function searchCard(condition) {
  var stmt = "SELECT * FROM 'card' as c WHERE " + condition + " AND c.Name NOT LIKE '(%'";
  $sql.value = stmt;
  // console.log("searchCard:", stmt);
  sqlDatabase.transaction(function(tx) {
    tx.executeSql(stmt, [], function(tx, results) {
      var jsonCard = getJsonResult(results);
      jsonCard ? (setCardsDescription(jsonCard), createSearchedCards(jsonCard, createCardItem)) : "";
      // console.log("jsonCard:", jsonCard);
      $cardSearchedResults = $('#hot-card .card-line');
      hideFilterClass();
      $('.page-load-incomplete').hide();
    }, function(tx, e) {
      $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
      $sqlPrepareStatement.classList.add("error");
    });
  });
}

/**
 * Search monster cards and present it in html.
 * @param {string} condition The SQL condition is composed of card attributes(name, race, attack type, ...)
 */
function searchMonster(condition) {
  var stmt = "SELECT * FROM 'card' as c, `monster` as m WHERE m.id = c.id AND " + condition + " AND c.Name NOT LIKE '(%'";
  $sql.value = stmt;
  // console.log("searchMonster:", stmt);
  sqlDatabase.transaction(function(tx) {
    tx.executeSql(stmt, [], function(tx, results) {
      var jsonCard = getJsonResult(results);
      jsonCard ? (setCardsDescription(jsonCard), createSearchedCards(jsonCard, createMonsterItem)) : "";
      // console.log("jsonCard:", jsonCard);
      $cardSearchedResults = $("#hot-card .card-line");
      $('.page-load-incomplete').hide();
    }, function(tx, e) {
      $sqlPrepareStatement.innerText += "\n" + e + "\n" + (e.message||"") +"\n"+ (e.stack||"");
      $sqlPrepareStatement.classList.add("error");
    });
  });
}

/**
 * Create DOM of searched cards for presentation in html.
 * @param {!json} jsonCard The rows of `card`, `monster` table with user search conditions.
 * @param {function} createItemFunction Function create skill/monster cards.
 */
function createSearchedCards(jsonCard, createItemFunction) {
  var cards = "";
  var smallCards = "";
  jsonCard.forEach(function(c) {
    if (c) {
      cards += createItemFunction(c);
      smallCards += createCardSmallItem(c);
    }
  });
  createBigCardTable(cards);
  createSmallCardTable(smallCards);
  hideShowMode();
}

/**
 * Transform phyle to human readable phyle string.
 * @param {string} phyle The race id from column name (Phyle - Phyle2) of `monster` table.
 */
function phyle2String(phyle) {
  switch (phyle) {
    case "1-0":
      return '人類';
    case "2-0":
      return '亡靈';
    case "3-0":
      return '野獸';
    case "4-0":
      return '地精';
    case "5-0":
      return '巨魔';
    case "6-0":
      return '精靈';
    case "7-0":
      return '獸人';
    case "8-0":
      return '異界';
    case "9-0":
      return '龍族';
    case "10-0":
      return '天使';
    case "11-0":
      return '惡魔';
    case "10-1":
      return '聖戰軍';
    case "6-1":
      return '半精靈';
    case "10-6":
      return '仙靈';
    case "11-5":
      return '暗巨魔';
    case "11-2":
      return '哀誓魔';
    case "5-2":
      return '拼接巨魔';
    case "9-3":
      return '多頭龍';
    case "9-4":
      return '龍奴';
    case "100-0":
      return '戰士';
    case "101-0":
      return '遊俠';
    case "102-0":
      return '法師';
    case "103-0":
      return '牧師';
    default:
      return '未知';
  }
}

// 100:戰士, 101:遊俠, 102:法師, 103:牧師
/**
 * Guess the job id of skill card id.
 * @param {number} id The skill card id of `card` table.
 */
function cardId2JobId(id) {
  if (id > 41000 && id < 42000) {
      return 100;
  } else if (id > 42000 && id < 43000) {
      return 101;
  } else if (id > 43000 && id < 44000) {
      return 102;
  } else if (id > 44000 && id < 45000) {
      return 103;
  } else if (id > 23374 && id < 23383) {
    switch ((id - 23375) % 4) {
      case 0:
        return 100;
      case 1:
        return 102;
      case 2:
        return 101;
      case 3:
        return 103;
    }
  } else if (id > 23382 && id < 24000) {
    switch ((id - 23375) % 4) {
      case 0:
        return 100;
      case 1:
        return 101;
      case 2:
        return 102;
      case 3:
        return 103;
    }
  }
  return 999;
}

/**
 * TODO: build a array/json instead of this function?
 * @param {number} jobId The job id from 100 to 103.
 */
function jobid2String(jobId) {
  switch (jobId) {
    case 100:
      return '戰士';
    case 101:
      return '遊俠';
    case 102:
      return '法師';
    case 103:
      return '牧師';
    default:
      return '無'; //地下城王的技能
  }
}

/**
 * Create DOM of a card normal skill description.
 * @param {object} card The card contains the value of `card` table.
 * @param {string} ability The column name of ability (cardAbility1, ..., cardAbility5).
 * @param {string} abilityName The temporary tag name (cardAbility1name, ..., cardAbility5name).
 * @param {string} abilityDescription The temporary tag name (cardAbility1des, ..., cardAbility5des).
 */
function createCardNormalSkill(card, ability, abilityName, abilityDescription) {
  if (card[ability] && jsonSkill[card["normalSkillID"]]["IsEffect"]) {
    var name = card[abilityName];
    var des = card[abilityDescription];
      return `
            <div class="cb" data-clipboard-text="[${name}]:${des}">
              <span class="card-ability-title">${name}</span>:${des}
            </div>`;
  } 
  card[abilityName] = ""; // 避免縮圖的能力名稱是undefined
  return ``;
}

/**
 * Create DOM of a card ability description.
 * @param {object} card The card contains the value of `card`, `monster` table.
 * @param {string} ability The column name of ability (cardAbility1, ..., cardAbility5, monsterAbility1, ..., monsterAbility5).
 * @param {string} abilityName The temporary tag name (cardAbility1name, ..., cardAbility5name, monsterAbility1name, ..., monsterAbility5name).
 * @param {string} abilityDescription The temporary tag name (cardAbility1des, ..., cardAbility5des, monsterAbility1des, ..., monsterAbility5des).
 */
function createCardAbility(card, ability, abilityName, abilityDescription) {
  if (card[ability] && card[abilityName]) {
    var name = card[abilityName];
    var des = card[abilityDescription];
      return `
            <div class="cb" data-clipboard-text="[${name}]:${des}">
              <span class="card-ability-title">${name}</span>:${des}
            </div>`;
  } 
  card[abilityName] = ""; // 避免縮圖的能力名稱是undefined
  return ``;
}

/**
 * Create DOM of a skill card.
 * @param {object} card The row value of `card` table.
 */
function createCardItem(card) {
  var jobid = cardId2JobId(card['ID']);
  var jobname = jobid2String(jobid);
  var unique = card['Unique'] ? '/菁英' : '';
  var hide = card['cardType'] == 2 ? "hide" : ''; // 技能(Type:2)
  card['cardAbility1'] = card['SkillID'];
  card['cardAbility1name'] = card['Name'];
  card['cardAbility1des'] = card['Des'];
  if (card['returnRate']) {
    card['cardAbility6'] = 9999; // 無意義單純設置不為0
    card['cardAbility6name'] = '精通';
    card['cardAbility6des'] = '本技能卡使用後有' + card['returnRate'] + '%機率回到準備欄';
  }
  var cardAbility1 = createCardAbility(card, 'cardAbility1', 'cardAbility1name', 'cardAbility1des');
  var cardAbility2 = createCardAbility(card, 'cardAbility2', 'cardAbility2name', 'cardAbility2des');
  var cardAbility3 = createCardAbility(card, 'cardAbility3', 'cardAbility3name', 'cardAbility3des');
  var cardAbility4 = createCardAbility(card, 'cardAbility4', 'cardAbility4name', 'cardAbility4des');
  var cardAbility5 = createCardAbility(card, 'cardAbility5', 'cardAbility5name', 'cardAbility5des');
  var cardAbility6 = createCardAbility(card, 'cardAbility6', 'cardAbility6name', 'cardAbility6des'); // 精通:技能卡專有能力
  var phyleImg = (jobid == 999 ? 100 : jobid) + "-0_n"; //地下城王的技能顯示為戰士技能
  // var phyle_hide = jobid > 103 ? "hide" : "";
  card["ResID_URL"] = "https://kakasfighter.github.io/images/cards/" + card["ResID"] + ".jpg";
  checkImageExists(card["ResID_URL"], null /*loadImageSuccess*/, loadImageError);
  return `
    <div class="col mb-3 bg-dark card-line phyle-id-${jobid} ir-id-${card['InitReady']} qt-${card['Quality']}">
      <div class="card-image">
        <div class="card-l lazyload" style="background-image: url(&quot;https://kakasfighter.github.io/images/cards/testcard_2.jpg&quot;);" data-bg="${card['ResID_URL']}">
          <img class="card-l-mask" src="https://kakasfighter.github.io/images/card_ui/card_l_mask.png">
          <div class="card-name cb" data-clipboard-text="★${card['Quality']+1} ${card['Name']}" style="opacity: 1;">${card['Name']}</div>
          <div class="card-quality-bg"></div>
          <div class="card-frame skill-card-frame">
            <div class="init-ready">${card['InitReady']}</div>
            <img class="card-phyle" src="https://kakasfighter.github.io/images/card_ui/rc_${phyleImg}.png">
            <div class="card-quality"><img src="https://kakasfighter.github.io/images/card_ui/q${card['Quality']+1}.png" alt="★${card['Quality']+1}" title="★${card['Quality']+1}"></div>
          </div>
        </div>
        <div class="card-r">
          <div class="card-skill-job-txt">${jobname}技能</div>
          <div class="card-ability-top hide">能力</div>
          <div class="card-ability">
            ${cardAbility1}
            ${cardAbility2}
            ${cardAbility3}
            ${cardAbility4}
            ${cardAbility5}
            ${cardAbility6}
          </div>
        </div>
      </div>
      <div class="card-description">
        <div class="svg-wrap">
          <div class="add-mycard float-left svg-plus" id="${card['todo_imm_card_id']}" data-state="plus"></div>													
          <div class="cb card-des" data-clipboard-text="★${card['Quality']+1} ${card['Name']}">★${card['Quality']+1} ${card['Name']}</div>
        </div>												
        <div class="note-1"></div>
        <div class="bg-description"></div>
      </div>
    </div><!--col end-->
`;
}

/**
 * Create DOM of a monster card.
 * @param {object} card The row value of `card`, `monster` table.
 */
function createMonsterItem(card) {
  var phyle = phyle2String(card['Phyle'] + '-' + card['Phyle2']);
  var unique = card['Unique'] ? '/菁英' : '';
  var hide = card['monsterType'] == 2 ? "hide" : ''; // 牆壁(Type:2):不顯示攻擊圖片
  var normalSkillId = createCardNormalSkill(card, 'normalSkillID', 'normalSkillIDname', 'normalSkillIDdes');
  var cardAbility1 = createCardAbility(card, 'cardAbility1', 'cardAbility1name', 'cardAbility1des');
  var cardAbility2 = createCardAbility(card, 'cardAbility2', 'cardAbility2name', 'cardAbility2des');
  var cardAbility3 = createCardAbility(card, 'cardAbility3', 'cardAbility3name', 'cardAbility3des');
  var cardAbility4 = createCardAbility(card, 'cardAbility4', 'cardAbility4name', 'cardAbility4des');
  var cardAbility5 = createCardAbility(card, 'cardAbility5', 'cardAbility5name', 'cardAbility5des');
  var monsterAbility1 = createCardAbility(card, 'monsterAbility1', 'monsterAbility1name', 'monsterAbility1des');
  var monsterAbility2 = createCardAbility(card, 'monsterAbility2', 'monsterAbility2name', 'monsterAbility2des');
  var monsterAbility3 = createCardAbility(card, 'monsterAbility3', 'monsterAbility3name', 'monsterAbility3des');
  var monsterAbility4 = createCardAbility(card, 'monsterAbility4', 'monsterAbility4name', 'monsterAbility4des');
  var monsterAbility5 = createCardAbility(card, 'monsterAbility5', 'monsterAbility5name', 'monsterAbility5des');
  var phyleImg = card['Phyle'] + "-0" + (card['Phyle'] > 99 ? "_n" : "");
  card["ResID_URL"] = "https://kakasfighter.github.io/images/cards/" + card["ResID"] + ".jpg";
  checkImageExists(card["ResID_URL"], null /*loadImageSuccess*/, loadImageError);
  return `
    <div class="col mb-3 bg-dark card-line phyle-id-${card['Phyle']}-${card['Phyle2']} at-id-${card['AttackType']} ir-id-${card['InitReady']} qt-${card['Quality']}">
      <div class="card-image">
        <div class="card-l lazyload" style="background-image: url(&quot;https://kakasfighter.github.io/images/cards/testcard_2.jpg&quot;);" data-bg="${card['ResID_URL']}">
          <img class="card-l-mask" src="https://kakasfighter.github.io/images/card_ui/card_l_mask.png">
          <div class="card-name cb" data-clipboard-text="★${card['Quality']+1} ${card['Name']}" style="opacity: 1;">${card['Name']}</div>
          <div class="card-quality-bg"></div>
          <div class="card-frame">
            <div class="init-ready">${card['InitReady']}</div>
            <img class="card-phyle" src="https://kakasfighter.github.io/images/card_ui/rc_${phyleImg}.png">
            <div class="card-quality"><img src="https://kakasfighter.github.io/images/card_ui/q${card['Quality']+1}.png" alt="★${card['Quality']+1}" title="★${card['Quality']+1}"></div>
            <div class="card-attack ${hide}">
              <img class="attack-type" src="https://kakasfighter.github.io/images/card_ui/at_${card['AttackType']}.png">
              <div class="attack-volume">${card['Attack']}</div>
            </div>
            <div class="card-hp">${card['HP']}</div>
          </div>
        </div>
        <div class="card-r">
          <div class="card-race-txt">${phyle}士兵${unique}</div>
          <div class="card-ability-top">能力</div>
          <div class="card-ability">
            ${normalSkillId}
            ${monsterAbility1}
            ${monsterAbility2}
            ${monsterAbility3}
            ${monsterAbility4}
            ${cardAbility1}
            ${cardAbility2}
            ${cardAbility3}
            ${cardAbility4}
            ${cardAbility5}
            ${monsterAbility5}
          </div>
        </div>
      </div>
      <div class="card-description">
        <div class="svg-wrap">
          <div class="add-mycard float-left svg-plus" id="${card['todo_imm_card_id']}" data-state="plus"></div>													
          <div class="cb card-des" data-clipboard-text="★${card['Quality']+1} ${card['Name']} (${card['InitReady']}/${card['Attack']}/${card['HP']})">★${card['Quality']+1} ${card['Name']} (${card['InitReady']}/${card['Attack']}/${card['HP']})</div>
        </div>												
        <div class="note-1"></div>
        <div class="bg-description"></div>
      </div>
    </div><!--col end-->
`;
}

/**
 * TODO: load ability name/description only once.
 * Create DOM of a monster/skill card.
 * @param {object} card The row value of `card`, `monster` table.
 */
function createCardSmallItem(card) {
  var hideSkill = card['cardType'] == 2 ? "hide" : ''; // 技能(Type:2)
  var hideWall = card['monsterType'] == 2 ? "hide" : ''; // 牆壁(Type:2):不顯示攻擊圖片
  var phyleImg = card['Phyle'] + "-0";
  var jobid = 0;
  var jobname = '';
  if (hideSkill) {
    jobid = cardId2JobId(card['ID']);
    jobname = jobid2String(jobid);
    card['cardAbility1'] = card['SkillID'];
    card['cardAbility1name'] = card['Name'];
    card['cardAbility1des'] = card['Des'];
    phyleImg = (jobid == 999 ? 100 : jobid) + "-0"; //地下城王的技能顯示為戰士技能
  }

  var phyle = phyle2String(card['Phyle'] + '-' + card['Phyle2']);
  var unique = card['Unique'] ? '/菁英' : '';
  var normalSkillId = createCardNormalSkill(card, 'normalSkillID', 'normalSkillIDname', 'normalSkillIDdes');
  var cardAbility1 = createCardAbility(card, 'cardAbility1', 'cardAbility1name', 'cardAbility1des');
  var cardAbility2 = createCardAbility(card, 'cardAbility2', 'cardAbility2name', 'cardAbility2des');
  var cardAbility3 = createCardAbility(card, 'cardAbility3', 'cardAbility3name', 'cardAbility3des');
  var cardAbility4 = createCardAbility(card, 'cardAbility4', 'cardAbility4name', 'cardAbility4des');
  var cardAbility5 = createCardAbility(card, 'cardAbility5', 'cardAbility5name', 'cardAbility5des');
  var monsterAbility1 = createCardAbility(card, 'monsterAbility1', 'monsterAbility1name', 'monsterAbility1des');
  var monsterAbility2 = createCardAbility(card, 'monsterAbility2', 'monsterAbility2name', 'monsterAbility2des');
  var monsterAbility3 = createCardAbility(card, 'monsterAbility3', 'monsterAbility3name', 'monsterAbility3des');
  var monsterAbility4 = createCardAbility(card, 'monsterAbility4', 'monsterAbility4name', 'monsterAbility4des');
  var monsterAbility5 = createCardAbility(card, 'monsterAbility5', 'monsterAbility5name', 'monsterAbility5des');
  card["ResID_URL"] = "https://kakasfighter.github.io/images/cards/" + card["ResID"] + ".jpg";
  checkImageExists(card["ResID_URL"], null /*loadImageSuccess*/, loadImageError);
  return `
      <div class="col-4 mb-1 card-line phyle-id-${jobid} phyle-id-${card['Phyle']}-${card['Phyle2']} at-id-${card['AttackType']} ir-id-${card['InitReady']} qt-${card['Quality']}">
        <div class="card-img-s" style="background-image:url(${card['ResID_URL']});">
          <div class="card-frame-s">
            <div class="init-ready-s">
              <span>${card['InitReady']}</span>
            </div>
            <img class="card-phyle-s" src="https://kakasfighter.github.io/images/card_ui/rc_${phyleImg}_n.png">
            <div class="card-quality-s">
              <img src="https://kakasfighter.github.io/images/card_ui/q${card['Quality']+1}.png">
            </div>
            <div class="card-ability-s">
              ${card['normalSkillIDname']} ${card['monsterAbility1name']} ${card['monsterAbility2name']} ${card['monsterAbility3name']} ${card['monsterAbility4name']} 
              ${card['cardAbility1name']} ${card['cardAbility2name']} ${card['cardAbility3name']} ${card['cardAbility4name']} ${card['cardAbility5name']} 
              ${card['monsterAbility5name']}
            </div>
            <div class="attack-volume-s ${hideSkill} ${hideWall}">${card['Attack']}</div>
            <div class="card-hp-s ${hideSkill}">${card['HP']}</div>
          </div>
        </div>
        <div class="card-name-s">${card['Name']}</div>
        <div class="btn-add-deck" data-uid="mBX1BX2{todo_imm_card_id}"></div>
      </div>
`;
}

// 可參考使用Fragments https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Performance_best_practices_for_Firefox_fe_engineers
/**
 * Create DOM of big card table and present in html.
 * @param {string} cards The DOM of cards.
 */
function createBigCardTable(cards) {
  $('#hot-card').append(`
<div id="my-card-big" class="card-table">
  <div class="row mb-3">
    <div class="col unit-title">
      <div class="m-1" title="收尋結果">收尋結果<span class="group-name gold-f">【官方連結】 <a href="https://nothing/detail.php?id=6666" class="text-white" target="_blank"><u>卡包名稱</u></a></span></div>
    </div>
  </div>
  <div class="row mb-3">
${cards}
  </div><!--row end-->
</div><!--card-table end-->
  `);
}

/**
 * Create DOM of small card table and present in html.
 * @param {string} cards The DOM of cards.
 */
function createSmallCardTable(cards) {
  $('#hot-card').append(`
<div id="my-card-small" class="col-auto">
  <div id="my-card-boad">
    <div class="row" id="my-card-list">
${cards}
    </div><!--row end-->
  </div><!--my-card-boad end-->
</div><!--my-card end-->
  `);
}

$(".sql-btn-card").on('click', function() {
  var cardId = $( this ).siblings("#card-id")[0].value;
  searchCardById(cardId);
});

// TODO: 效能問題卡住UI, google: 'javascript async database calls'
/**
 * Hide DOM of class by card race, attack type, initial ready, quality, name.
 */
function hideFilterClass() {
  var filterClassArray = ["card-line"];
  var filterCount = 0;
  var checkedQualityArray = [];
  var elite = $('input[name="elite"]:checked').val();
  var race = $('input[name="race"]:checked').val();
  var attackType = $('input[name="attack_type"]:checked').val();
  var initReady = $('input[name="init_ready"]:checked').val();
  var name = $searchCardName.value;
  // console.log("hideFilterClass[start]", elite, race, attackType, initReady, name);
  if (elite != "all") {
    console.log("elite:", elite);
    if (elite == 2) {
      $raceMonsterRadio.hide();
      $attackTypeWrap.hide();
      $overInitReadyWrap.hide();
      
      var phyle = race.split('-')[0];
      if (race != "all" && phyle < 100) {
        $raceAllRadio.prop("checked", true);
      }
      if (initReady > 8) {
        $initReadyAllRadio.prop("checked", true);
      }
    } else {
      $raceMonsterRadio.show();
      $attackTypeWrap.show();
      $overInitReadyWrap.show();
    }
  }
  
  if (race != "all") {
    console.log("race:", race);
    filterClassArray.push("phyle-id-" + race);
    filterCount++;
  }
  if (attackType != "all") {
    console.log("attack_type:", attackType);
    filterClassArray.push("at-id-" + attackType);
    filterCount++;
  }
  if (initReady != "all") {
    console.log("init_ready:", initReady);
    filterClassArray.push("ir-id-" + initReady);
    filterCount++;
  }
  $('input[name="quality[]"]:checked').each(function() {
    console.log("quality:", $(this).val());
    checkedQualityArray.push("qt-" + $(this).val());
		filterCount++;
  });
  
  if (!$('input[name="quality[]"]:checked').length) {
    checkedQualityArray.push("qt-0");
    checkedQualityArray.push("qt-1");
    checkedQualityArray.push("qt-2");
		filterCount++;
  }
  
  if (filterCount == 0) {
    $cardSearchedResults.removeClass('hide');
  } else {
    var fcj_1 = "#hot-card ." + filterClassArray.join(".");
    $cardSearchedResults.addClass('hide');
    
    var rch_arr_2 = [];
    for (let i = 0; i < checkedQualityArray.length; i++) {
      rch_arr_2.push(fcj_1 + "." + checkedQualityArray[i]);
    }
    if (name) {
      $(rch_arr_2.join(",")).filter(function(index , element) { 
        var result = $('.card-name:contains("' + name + '")', element).length > 0;
        // console.log(result, index, element);
        return result;
      }).removeClass('hide');
    } else {
      $(rch_arr_2.join(",")).removeClass('hide');
    }
  }
  // console.log("hideFilterClass[end]", elite, race, attackType, initReady, name);
}

/**
 * Check mode and show big/small card image.
 */
function hideShowMode() {
  var showMode = $('input[name="show_mode"]:checked').val();
  console.log("[hideShowMode]show_mode:", showMode);
  if (showMode == "big") {
    $('#my-card-big').removeClass('hide');
    $('#my-card-small').addClass('hide');
  } else {
    $('#my-card-big').addClass('hide');
    $('#my-card-small').removeClass('hide');
  }
}

$('input[name="quality[]"]').change(function() {
  console.log("[radio:change]quality:");
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.02);
});
$('input[name="elite"]:radio').change(function() {
  console.log("[radio:change]elite:");
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.02);
});
$('input[name="race"]:radio').change(function() {
  console.log("[radio:change]race:");
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.02);
});
$('input[name="attack_type"]:radio').change(function() {
  console.log("[radio:change]attack_type:");
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.02);
});
$('input[name="init_ready"]:radio').change(function() {
  console.log("[radio:change]init_ready:");
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.02);
});
$('input[name="show_mode"]:radio').change(function() {
  hideShowMode();
});

$("#search-card-name").keypress(function(e) {
  var code = (e.keyCode ? e.keyCode : e.which);
  if (code == 13) { // keyboard enter event code
    $("#btn-search-cards").click();
  }
});

$("#search-card-name").on('input propertychange', function() {
  var name = this.value;
  console.log("search-card-name:", name);
  $previousFilterTimeoutId ? clearTimeout($previousFilterTimeoutId) : "";
  $previousFilterTimeoutId = setTimeout(function() { hideFilterClass(); }, 0.25);
});

$("#btn-search-cards").on('click', function() {
  console.log("[btn-search-cards]:");
  $('.page-load-incomplete').show();
  $('#hot-card').empty();
  var qualityCondition = "";
  var qualityOrConditionArray = [];
  var eliteCondition = "";
  var raceCondition = "";
  var attackTypeCondition = "";
  var initReadyCondition = "";
  var nameCondition = "";
  var monsterConditionArray = []; // monster card
  var cardConditionArray = []; // skill card 
  
  $('input[name="quality[]"]:checked').each(function() {
    var quality = $(this).val();
    qualityOrConditionArray.push("c.quality = " + quality);
    console.log("quality:", quality);
  });
  if (!$('input[name="quality[]"]:checked').length) {
    qualityOrConditionArray.push("c.quality = 0");
    qualityOrConditionArray.push("c.quality = 1");
    qualityOrConditionArray.push("c.quality = 2");
  }
  qualityCondition = "(" + qualityOrConditionArray.join(" OR ") + ")";
  
  if ($('input[name="elite"]:checked').val() != "all") {
    var elite = $('input[name="elite"]:checked').val();
    eliteCondition = elite == 2 ? " c.cardType = " + elite : " m.'Unique' = " + elite;
    console.log("elite:", elite);
  }

  if ($('input[name="race"]:checked').val() != "all") {
    var race = $('input[name="race"]:checked').val().split('-');
    var phyle = race[0];
    var phyle2 = race[1] ? race[1] : 0;
    raceCondition = " m.phyle = " + phyle + " AND m.phyle2 = " + phyle2;
    console.log("race:", race, "phyle:", phyle, "phyle2:", phyle2);
  }

  if ($('input[name="attack_type"]:checked').val() != "all") {
    var attackType = $('input[name="attack_type"]:checked').val();
    // (7:牆壁)[SQL Cond] m.monsterType = 2
    if (attackType == 7) {
      attackTypeCondition = " m.monsterType = 2";
    } else {
      attackTypeCondition = " m.attacktype = " + attackType;
    }
    console.log("attack_type:", attackType);
  }

  if ($('input[name="init_ready"]:checked').val() != "all") {
    var initReady = $('input[name="init_ready"]:checked').val();
    initReadyCondition = " c.initReady = " + initReady;
    console.log("init_ready:", initReady);
  }

  if ($searchCardName.value) {
    var name = $searchCardName.value;
    nameCondition = " c.name LIKE '%" + name + "%'";
    console.log("name:", name);
  }
  
  qualityCondition ? (monsterConditionArray.push(qualityCondition), cardConditionArray.push(qualityCondition)) : "";
  eliteCondition ? (monsterConditionArray.push(eliteCondition), cardConditionArray.push(eliteCondition)) : "";
  raceCondition ? monsterConditionArray.push(raceCondition) : "";
  attackTypeCondition ? monsterConditionArray.push(attackTypeCondition) : "";
  initReadyCondition ? (monsterConditionArray.push(initReadyCondition), cardConditionArray.push(initReadyCondition)) : "";
  nameCondition ? (monsterConditionArray.push(nameCondition), cardConditionArray.push(nameCondition)) : "";
  
  if (elite == 2) {
    // 2:技能
    searchCard(cardConditionArray.join(" AND "));
  } else {
    // 0:士兵, 1:菁英
    searchMonster(monsterConditionArray.join(" AND "));
  }
});

/**
 * Check if an image URL exists or not.
 * @param {!string} imageUrl The URL of an image.
 * @param {?loadImageSuccess} successCallback The callback executed after loading image successfully.
 * @param {?loadImageError} errorCallback The callback executed after loading image unsuccessfully.
 */
function checkImageExists(imageUrl, successCallback, errorCallback) {
  // 設定false關閉測試
  if (!DEBUG_CHECK_IF_IMAGE_EXIST) return;
  var ImageObject = new Image(); //判断图片是否存在
  ImageObject.onload = function() {
    // console.log(ImageObject.width, ImageObject.height);
    successCallback && successCallback(ImageObject);
  };
  ImageObject.onerror = function() {
    // console.log("error");
    errorCallback && errorCallback(ImageObject);
  };
  ImageObject.src = imageUrl;
}

/**
 * The callback shows success message after loading image successfully.
 * @callback loadImageSuccess
 * @param {!Image} Image loaded.
 */
function loadImageSuccess(ImageObject) {
  console.log("[Image::success] ", ImageObject.src);
}

/**
 * The callback shows error message after loading image unsuccessfully.
 * @callback loadImageError
 * @param {!Image} Image loaded.
 */
function loadImageError(ImageObject) {
  console.log("[Image::(404)Not found] ", ImageObject.src);
}