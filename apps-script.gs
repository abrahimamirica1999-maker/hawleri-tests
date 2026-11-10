/**
 * posts context (human check of arabickurdishbot's Instagram post texts) → Google Sheet
 *
 * Bound to the spreadsheet that served the old hawleri-tests review (Extensions → Apps Script from inside it).
 * Its old tabs are left alone; this script writes two NEW tabs:
 *   posts_answers — one row per text, UPSERTED on item_id (re-sending corrects in place)
 *   posts_log     — every submission appended raw, never edited
 * Deploy: Manage deployments → edit the existing web app → New version (the /exec URL stays the same).
 * Execute as: Me. Who has access: Anyone (the page posts no-cors).
 * GET ?answers=1 returns posts_answers as JSON, for review.py --pull.
 */

var ANSWERS = 'posts_answers';
var LOG = 'posts_log';
var HEAD = ['group', 'post_line', 'post', 'where', 'write_in', 'english', 'text_now', 'other_language',
            'decision', 'correct_text', 'changed', 'note', 'item_id', 'device', 'updated_at'];
var ID_COL = 13;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    var rows = body.rows || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = sheet(ss, LOG, ['received_at', 'device', 'batch', 'rows', 'json']);
    log.appendRow([new Date(), body.device || '', body.batch || '', rows.length, e.postData.contents.slice(0, 40000)]);
    var sh = sheet(ss, ANSWERS, HEAD);
    var last = sh.getLastRow();
    var ids = last > 1 ? sh.getRange(2, ID_COL, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    var at = {};
    for (var i = 0; i < ids.length; i++) at[ids[i]] = i + 2;
    var append = [], pending = {};
    for (var k = 0; k < rows.length; k++) {
      var r = rows[k], line = [r.group, r.row, r.section, r.course, r.write_in, r.english, r.text_now, r.suggested_fix,
                               r.decision, r.correct_text, r.changed, r.note, r.id, body.device || '', new Date()];
      if (at[r.id]) sh.getRange(at[r.id], 1, 1, HEAD.length).setValues([line]);
      else if (pending[r.id] !== undefined) append[pending[r.id]] = line;
      else { pending[r.id] = append.length; append.push(line); }
    }
    if (append.length) sh.getRange(sh.getLastRow() + 1, 1, append.length, HEAD.length).setValues(append);
    return ok({ ok: true, written: rows.length, appended: append.length });
  } catch (err) {
    return ok({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.answers) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWERS);
    if (!sh || sh.getLastRow() < 2) return ok({ ok: true, rows: [] });
    var v = sh.getRange(1, 1, sh.getLastRow(), HEAD.length).getValues(), head = v[0], out = [];
    for (var i = 1; i < v.length; i++) { var o = {}; for (var j = 0; j < head.length; j++) o[head[j]] = v[i][j]; out.push(o); }
    return ok({ ok: true, rows: out });
  }
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
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
