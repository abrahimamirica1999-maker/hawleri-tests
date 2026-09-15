/**
 * hawleri-tests → Google Sheet
 *
 * Bound to the NEW spreadsheet (Extensions → Apps Script from inside that
 * sheet). Deploy → New deployment → Web app → Execute as: Me → Who has access:
 * Anyone. Copy the /exec URL into SHEET_URL in index.html.
 *
 * Two tabs, on purpose:
 *   answers — one row per test string, UPSERTED on item_id. This is the sheet
 *             you actually read. Re-sending a row corrects it in place instead
 *             of piling up duplicates.
 *   log     — every submission appended raw, never edited. If anything ever
 *             goes wrong with the upsert, nothing she typed is lost.
 *
 * The page posts with mode:"no-cors", so it cannot read the response and the
 * response body does not matter — only that the write happened.
 */

var ANSWERS = 'answers';
var LOG = 'log';

var HEAD = ['batch', 'item_id', 'item_no', 'unit', 'occurrences', 'english',
            'arabic', 'standard_sorani', 'my_hawleri', 'her_hawleri',
            'changed', 'confidence', 'device', 'updated_at'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    var rows = body.rows || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // raw log first, so a later failure still leaves the evidence
    var log = sheet(ss, LOG, ['received_at', 'device', 'batch', 'rows', 'json']);
    log.appendRow([new Date(), body.device || '', body.batch || '', rows.length,
                   e.postData.contents.slice(0, 40000)]);

    var sh = sheet(ss, ANSWERS, HEAD);
    var last = sh.getLastRow();
    var ids = last > 1
      ? sh.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return r[0]; })
      : [];
    var at = {};
    for (var i = 0; i < ids.length; i++) at[ids[i]] = i + 2;   // id -> sheet row

    var append = [], pending = {};
    for (var k = 0; k < rows.length; k++) {
      var r = rows[k], line = [
        body.batch || '', r.id, r.n, r.unit, r.occ, r.en, r.ar,
        r.std, r.draft, r.answer, r.changed, r.conf,
        body.device || '', new Date()
      ];
      if (at[r.id]) {
        sh.getRange(at[r.id], 1, 1, HEAD.length).setValues([line]);
      } else if (pending[r.id] !== undefined) {
        append[pending[r.id]] = line;      // same id twice in one payload
      } else {
        pending[r.id] = append.length;
        append.push(line);
      }
    }
    if (append.length) {
      sh.getRange(sh.getLastRow() + 1, 1, append.length, HEAD.length)
        .setValues(append);
    }
    return ok({ ok: true, written: rows.length, appended: append.length });
  } catch (err) {
    return ok({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ok({ ok: true, alive: true });
}

function sheet(ss, name, head) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
  }
  return sh;
}

function ok(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
