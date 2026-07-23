/**
 * Lets Python talk to Postgres inside a browser tab.
 *
 * A normal program reaches Postgres over a TCP socket, which a browser will
 * never allow. Both halves do exist in WebAssembly — Pyodide is CPython, PGlite
 * is Postgres — but a `psycopg2` call is synchronous and everything in a
 * browser is asynchronous, so the two cannot simply be introduced.
 *
 * PGlite's `execProtocolRawSync` is the way through: it speaks the Postgres wire
 * protocol synchronously. So the JS half below frames a Simple Query, hands the
 * bytes straight to Postgres, and decodes the reply in the same tick — no
 * promises, no `SharedArrayBuffer`, no cross-origin isolation, and no
 * dependence on JSPI. The Python half is a `psycopg2` implementation over that
 * one synchronous call.
 *
 * Both halves are source strings because the runtime is a worker assembled at
 * run time. They are exercised by scripts/check-pg-bridge.mjs, which evaluates
 * these exact strings against a real PGlite, so the tested code is the shipped
 * code.
 */

/**
 * JS half. Defines `__pgExec(sql)` on the worker's global scope, returning a
 * JSON string: { results: [{ columns: [{name, oid}], rows, command, rowCount }],
 * error: {...} | null }. Values arrive as strings (or null) exactly as Postgres
 * renders them; turning them into Python objects is the Python half's job,
 * where Decimal and datetime live.
 */
export const PG_BRIDGE_JS = String.raw`
(function () {
  var enc = new TextEncoder();
  var dec = new TextDecoder();

  function queryMessage(sql) {
    var body = enc.encode(sql);
    // 'Q', int32 length (self-inclusive), the SQL, NUL.
    var buf = new Uint8Array(1 + 4 + body.length + 1);
    var view = new DataView(buf.buffer);
    buf[0] = 0x51; // 'Q'
    view.setInt32(1, 4 + body.length + 1, false);
    buf.set(body, 5);
    buf[buf.length - 1] = 0;
    return buf;
  }

  function Reader(bytes) {
    this.b = bytes;
    this.v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.i = 0;
  }
  Reader.prototype.u8 = function () { return this.b[this.i++]; };
  Reader.prototype.i16 = function () { var n = this.v.getInt16(this.i, false); this.i += 2; return n; };
  Reader.prototype.i32 = function () { var n = this.v.getInt32(this.i, false); this.i += 4; return n; };
  Reader.prototype.str = function () {
    var start = this.i;
    while (this.i < this.b.length && this.b[this.i] !== 0) this.i++;
    var s = dec.decode(this.b.subarray(start, this.i));
    this.i++; // NUL
    return s;
  };
  Reader.prototype.bytes = function (n) {
    var s = this.b.subarray(this.i, this.i + n);
    this.i += n;
    return s;
  };

  // A Simple Query can carry several statements, so the reply is a sequence of
  // result sets. Anything Postgres reports as an error ends the whole batch.
  function decode(bytes) {
    var r = new Reader(bytes);
    var results = [];
    var current = null;
    var error = null;
    var notices = [];

    while (r.i < bytes.length) {
      var type = r.u8();
      var len = r.i32();
      var end = r.i + len - 4;

      if (type === 0x54) {          // 'T' RowDescription
        var n = r.i16();
        var columns = [];
        for (var c = 0; c < n; c++) {
          var name = r.str();
          r.i32();                  // table oid
          r.i16();                  // column attribute number
          var oid = r.i32();
          r.i16();                  // type size
          r.i32();                  // type modifier
          r.i16();                  // format code (always 0/text for Simple Query)
          columns.push({ name: name, oid: oid });
        }
        current = { columns: columns, rows: [], command: null, rowCount: 0 };
        results.push(current);
      } else if (type === 0x44) {   // 'D' DataRow
        var count = r.i16();
        var row = [];
        for (var f = 0; f < count; f++) {
          var size = r.i32();
          row.push(size === -1 ? null : dec.decode(r.bytes(size)));
        }
        if (!current) {
          current = { columns: [], rows: [], command: null, rowCount: 0 };
          results.push(current);
        }
        current.rows.push(row);
      } else if (type === 0x43) {   // 'C' CommandComplete
        var tag = r.str();
        if (!current) {
          current = { columns: [], rows: [], command: null, rowCount: 0 };
          results.push(current);
        }
        current.command = tag;
        // "INSERT 0 3" / "UPDATE 2" / "SELECT 7" — the trailing number is the count.
        var parts = tag.split(' ');
        var last = parseInt(parts[parts.length - 1], 10);
        current.rowCount = isNaN(last) ? current.rows.length : last;
        current = null;
      } else if (type === 0x45) {   // 'E' ErrorResponse
        var e = {};
        for (;;) {
          var code = r.u8();
          if (code === 0) break;
          e[String.fromCharCode(code)] = r.str();
        }
        error = {
          severity: e.S || e.V || 'ERROR',
          sqlstate: e.C || null,
          message: e.M || 'database error',
          detail: e.D || null,
          hint: e.H || null,
          position: e.P || null,
        };
        r.i = end;
      } else if (type === 0x4e) {   // 'N' NoticeResponse
        var nfields = {};
        for (;;) {
          var ncode = r.u8();
          if (ncode === 0) break;
          nfields[String.fromCharCode(ncode)] = r.str();
        }
        notices.push(nfields.M || '');
        r.i = end;
      } else if (type === 0x49) {   // 'I' EmptyQueryResponse
        r.i = end;
      } else {
        // ReadyForQuery, ParameterStatus, anything else: not needed here.
        r.i = end;
      }
      if (r.i < end) r.i = end;
    }
    return { results: results, error: error, notices: notices };
  }

  // Set by the worker once PGlite has finished its asynchronous start-up.
  self.__pgDb = self.__pgDb || null;

  self.__pgExec = function (sql) {
    if (!self.__pgDb) {
      return JSON.stringify({
        results: [],
        error: { severity: 'FATAL', sqlstate: '08003', message: 'no database is attached to this question' },
      });
    }
    try {
      var reply = self.__pgDb.execProtocolRawSync(queryMessage(sql));
      return JSON.stringify(decode(reply));
    } catch (err) {
      return JSON.stringify({
        results: [],
        error: { severity: 'FATAL', sqlstate: null, message: String((err && err.message) || err) },
      });
    }
  };
})();
`;

/**
 * Python half: a `psycopg2` built on `__pgExec`.
 *
 * Scope is deliberate. The DB-API surface a program actually uses — connect,
 * cursor, execute with parameters, the fetch family, description, rowcount,
 * context managers, iteration — is implemented properly, including turning
 * Postgres values back into `date`, `Decimal` and friends. Everything outside
 * that surface raises `NotSupportedError` naming itself, because a stand-in
 * that quietly returns something plausible but wrong is far worse than one that
 * says it cannot do the job.
 */
export const PSYCOPG2_PY = String.raw`
import sys, json, types, datetime, decimal, re

_exec = None  # bound to the JS bridge at import time

class Warning(Exception): pass
class Error(Exception):
    def __init__(self, message, sqlstate=None, detail=None, hint=None):
        super().__init__(message)
        self.pgcode = sqlstate
        self.pgerror = message
        self.detail = detail
        self.hint = hint
class InterfaceError(Error): pass
class DatabaseError(Error): pass
class DataError(DatabaseError): pass
class OperationalError(DatabaseError): pass
class IntegrityError(DatabaseError): pass
class InternalError(DatabaseError): pass
class ProgrammingError(DatabaseError): pass
class NotSupportedError(DatabaseError): pass

# SQLSTATE class -> the exception psycopg2 raises, so "except IntegrityError"
# behaves the way it does against a real server.
def _exc_for(sqlstate):
    if not sqlstate:
        return DatabaseError
    cls = sqlstate[:2]
    if cls == '23': return IntegrityError
    if cls in ('42', '22'): return ProgrammingError if cls == '42' else DataError
    if cls in ('08', '53', '57', '58'): return OperationalError
    if cls == '0A': return NotSupportedError
    return DatabaseError

# ---------------------------------------------------------------------------
# Values: Postgres text -> Python
# ---------------------------------------------------------------------------
def _parse_ts(s):
    s = s.strip()
    m = re.match(r'^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?(([+-]\d{2})(:?\d{2})?)?$', s)
    if not m:
        return s
    frac = m.group(3) or ''
    micro = int(round(float(frac) * 1_000_000)) if frac else 0
    base = datetime.datetime.strptime(m.group(1) + ' ' + m.group(2), '%Y-%m-%d %H:%M:%S')
    base = base.replace(microsecond=micro)
    off = m.group(4)
    if off:
        hours = int(m.group(5))
        mins = int((m.group(6) or '0').lstrip(':') or 0)
        delta = datetime.timedelta(hours=abs(hours), minutes=mins)
        if hours < 0:
            delta = -delta
        base = base.replace(tzinfo=datetime.timezone(delta))
    return base

def _parse_time(s):
    s = s.strip()
    m = re.match(r'^(\d{2}):(\d{2}):(\d{2})(\.\d+)?', s)
    if not m:
        return s
    frac = m.group(4) or ''
    return datetime.time(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                         int(round(float(frac) * 1_000_000)) if frac else 0)

def _parse_array(s, item):
    # Postgres renders arrays as {a,b,"c,d",NULL}. Good enough for 1-D values.
    if not s.startswith('{') or not s.endswith('}'):
        return s
    body, out, buf, inq, esc = s[1:-1], [], '', False, False
    if body == '':
        return []
    for ch in body:
        if esc:
            buf += ch; esc = False
        elif ch == '\\':
            esc = True
        elif ch == '"':
            inq = not inq
        elif ch == ',' and not inq:
            out.append(buf); buf = ''
        else:
            buf += ch
    out.append(buf)
    return [None if (v == 'NULL' and not inq) else item(v) for v in out]

_TEXT = lambda v: v
_BOOL = lambda v: v == 't'
_BYTEA = lambda v: bytes.fromhex(v[2:]) if v.startswith('\\x') else v.encode()
_JSON = lambda v: json.loads(v)
_DATE = lambda v: datetime.datetime.strptime(v, '%Y-%m-%d').date()

# oid -> converter. Anything not listed stays the text Postgres sent, which is
# what psycopg2 does for types it has no adapter for.
_OID = {
    16: _BOOL, 17: _BYTEA, 18: _TEXT, 19: _TEXT,
    20: int, 21: int, 23: int, 26: int,
    25: _TEXT, 1042: _TEXT, 1043: _TEXT,
    700: float, 701: float,
    1700: decimal.Decimal,
    1082: _DATE, 1083: _parse_time, 1114: _parse_ts, 1184: _parse_ts,
    114: _JSON, 3802: _JSON,
    2950: _TEXT,
}
_ARRAY_OID = {
    1000: _BOOL, 1005: int, 1007: int, 1016: int, 1009: _TEXT, 1015: _TEXT,
    1021: float, 1022: float, 1231: decimal.Decimal, 1182: _DATE, 1115: _parse_ts,
}

def _convert(value, oid):
    if value is None:
        return None
    if oid in _ARRAY_OID:
        return _parse_array(value, _ARRAY_OID[oid])
    fn = _OID.get(oid)
    if fn is None:
        return value
    try:
        return fn(value)
    except Exception:
        return value

# ---------------------------------------------------------------------------
# Values: Python -> SQL literal (client-side, as psycopg2 does)
# ---------------------------------------------------------------------------
def _quote(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float, decimal.Decimal)):
        return str(v)
    if isinstance(v, (bytes, bytearray)):
        return "'\\x" + bytes(v).hex() + "'::bytea"
    if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
        return "'" + v.isoformat() + "'"
    if isinstance(v, (list, tuple)):
        return 'ARRAY[' + ','.join(_quote(x) for x in v) + ']'
    if isinstance(v, dict):
        return "'" + json.dumps(v).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

def _mogrify(query, vars=None):
    if vars is None:
        return query
    if isinstance(vars, dict):
        out, i = '', 0
        # %(name)s, leaving %% alone.
        while i < len(query):
            if query[i] == '%' and i + 1 < len(query):
                if query[i+1] == '%':
                    out += '%'; i += 2; continue
                if query[i+1] == '(':
                    j = query.index(')', i)
                    key = query[i+2:j]
                    if query[j+1] != 's':
                        raise ProgrammingError('only %(name)s placeholders are supported')
                    out += _quote(vars[key]); i = j + 2; continue
            out += query[i]; i += 1
        return out
    if not isinstance(vars, (list, tuple)):
        vars = (vars,)
    out, i, n = '', 0, 0
    while i < len(query):
        if query[i] == '%' and i + 1 < len(query):
            if query[i+1] == '%':
                out += '%'; i += 2; continue
            if query[i+1] == 's':
                if n >= len(vars):
                    raise ProgrammingError('not enough arguments for format string')
                out += _quote(vars[n]); n += 1; i += 2; continue
        out += query[i]; i += 1
    if n != len(vars):
        raise ProgrammingError('too many arguments for format string')
    return out

# ---------------------------------------------------------------------------
# DB-API
# ---------------------------------------------------------------------------
class Column(tuple):
    # psycopg2's description entries are 7-tuples that also expose .name.
    def __new__(cls, name, type_code):
        self = super().__new__(cls, (name, type_code, None, None, None, None, None))
        return self
    def __init__(self, name, type_code):
        self.name = name
        self.type_code = type_code

class Cursor:
    arraysize = 1
    def __init__(self, connection):
        self.connection = connection
        self.description = None
        self.rowcount = -1
        self._rows = []
        self._pos = 0
        self.closed = False

    def _check(self):
        if self.closed:
            raise InterfaceError('cursor already closed')
        if self.connection.closed:
            raise InterfaceError('connection already closed')

    def execute(self, query, vars=None):
        self._check()
        sql = _mogrify(query, vars)
        raw = json.loads(_exec(sql))
        err = raw.get('error')
        if err:
            raise _exc_for(err.get('sqlstate'))(
                err.get('message') or 'database error',
                err.get('sqlstate'), err.get('detail'), err.get('hint'))
        results = raw.get('results') or []
        last = results[-1] if results else None
        if last and last.get('columns'):
            cols = last['columns']
            self.description = [Column(c['name'], c['oid']) for c in cols]
            oids = [c['oid'] for c in cols]
            self._rows = [
                tuple(_convert(v, oids[i]) for i, v in enumerate(row))
                for row in last.get('rows') or []
            ]
            self.rowcount = len(self._rows)
        else:
            self.description = None
            self._rows = []
            self.rowcount = last.get('rowCount', -1) if last else -1
        self._pos = 0
        return None

    def executemany(self, query, seq):
        self._check()
        total = 0
        for vars in seq:
            self.execute(query, vars)
            if self.rowcount and self.rowcount > 0:
                total += self.rowcount
        self.rowcount = total
        self._rows = []
        self.description = None
        return None

    def mogrify(self, query, vars=None):
        return _mogrify(query, vars).encode()

    def fetchone(self):
        self._check()
        if self._pos >= len(self._rows):
            return None
        row = self._rows[self._pos]
        self._pos += 1
        return row

    def fetchmany(self, size=None):
        self._check()
        size = self.arraysize if size is None else size
        out = self._rows[self._pos:self._pos + size]
        self._pos += len(out)
        return out

    def fetchall(self):
        self._check()
        out = self._rows[self._pos:]
        self._pos = len(self._rows)
        return out

    def __iter__(self):
        while True:
            row = self.fetchone()
            if row is None:
                return
            yield row

    def close(self):
        self.closed = True
    def __enter__(self):
        return self
    def __exit__(self, *a):
        self.close()

    def callproc(self, *a, **k):
        raise NotSupportedError('callproc is not available in the browser runtime')
    def copy_from(self, *a, **k):
        raise NotSupportedError('copy_from is not available in the browser runtime')
    def copy_to(self, *a, **k):
        raise NotSupportedError('copy_to is not available in the browser runtime')
    def copy_expert(self, *a, **k):
        raise NotSupportedError('copy_expert is not available in the browser runtime')
    def setinputsizes(self, *a): pass
    def setoutputsize(self, *a): pass

class DictRow(dict):
    """Row that also indexes positionally, like psycopg2.extras.DictRow."""
    def __init__(self, values, names):
        super().__init__(zip(names, values))
        self._values = tuple(values)
    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)

class _MappingCursor(Cursor):
    _row = None
    def _wrap(self, rows):
        if self.description is None:
            return rows
        names = [c.name for c in self.description]
        return [self._row(r, names) for r in rows]
    def fetchone(self):
        row = super().fetchone()
        return None if row is None else self._wrap([row])[0]
    def fetchmany(self, size=None):
        return self._wrap(super().fetchmany(size))
    def fetchall(self):
        return self._wrap(super().fetchall())

class DictCursor(_MappingCursor):
    _row = staticmethod(lambda values, names: DictRow(values, names))

class RealDictCursor(_MappingCursor):
    _row = staticmethod(lambda values, names: dict(zip(names, values)))

class Connection:
    def __init__(self, dsn=''):
        self.dsn = dsn
        self.closed = False
        self.autocommit = False
    def cursor(self, name=None, cursor_factory=None):
        if name:
            raise NotSupportedError('server-side (named) cursors are not available in the browser runtime')
        if self.closed:
            raise InterfaceError('connection already closed')
        return (cursor_factory or Cursor)(self)
    # PGlite holds one session, so a commit is a real commit and a rollback
    # really rolls back — but nothing is pooled and nothing is concurrent.
    def commit(self):
        if not self.autocommit:
            _exec('COMMIT')
            _exec('BEGIN')
    def rollback(self):
        if not self.autocommit:
            _exec('ROLLBACK')
            _exec('BEGIN')
    def close(self):
        self.closed = True
    def __enter__(self):
        return self
    def __exit__(self, exc_type, *a):
        if exc_type is None:
            self.commit()
        else:
            self.rollback()

def connect(dsn=None, connection_factory=None, cursor_factory=None, **kwargs):
    """
    Accepts the arguments a program would pass a real server — dbname, user,
    password, host, port — and ignores them: there is exactly one database here,
    the one the question set up. Programs are still written the portable way,
    reading the name from argv and the credentials from the environment, and
    they run unchanged against a real server.
    """
    if connection_factory is not None:
        raise NotSupportedError('connection_factory is not available in the browser runtime')
    return Connection(dsn or '')

apilevel = '2.0'
threadsafety = 1
paramstyle = 'pyformat'
__version__ = '2.9.9 (browser runtime)'

def _install(bridge):
    global _exec
    _exec = bridge

    mod = sys.modules[__name__]

    extras = types.ModuleType('psycopg2.extras')
    extras.DictCursor = DictCursor
    extras.RealDictCursor = RealDictCursor
    extras.DictRow = DictRow
    def _unsupported(name):
        def fn(*a, **k):
            raise NotSupportedError(name + ' is not available in the browser runtime')
        return fn
    extras.execute_values = _unsupported('execute_values')
    extras.execute_batch = _unsupported('execute_batch')
    extras.Json = lambda v, dumps=None: (dumps or json.dumps)(v)

    errors = types.ModuleType('psycopg2.errors')
    for _n in ('Error', 'DatabaseError', 'DataError', 'OperationalError',
               'IntegrityError', 'InternalError', 'ProgrammingError',
               'NotSupportedError', 'InterfaceError'):
        setattr(errors, _n, globals()[_n])

    ext = types.ModuleType('psycopg2.extensions')
    ext.ISOLATION_LEVEL_AUTOCOMMIT = 0
    ext.connection = Connection
    ext.cursor = Cursor
    ext.adapt = lambda v: _quote(v)
    ext.register_adapter = _unsupported('register_adapter')

    mod.extras = extras
    mod.errors = errors
    mod.extensions = ext
    sys.modules['psycopg2'] = mod
    sys.modules['psycopg2.extras'] = extras
    sys.modules['psycopg2.errors'] = errors
    sys.modules['psycopg2.extensions'] = ext

    # psycopg (v3) programs use the same calls for this kind of work.
    pg3 = types.ModuleType('psycopg')
    for _n in ('connect', 'Connection', 'Cursor', 'Error', 'DatabaseError',
               'ProgrammingError', 'IntegrityError', 'OperationalError',
               'NotSupportedError', 'InterfaceError', 'DataError'):
        setattr(pg3, _n, globals()[_n])
    pg3.rows = types.ModuleType('psycopg.rows')
    pg3.rows.dict_row = RealDictCursor
    sys.modules['psycopg'] = pg3
    sys.modules['psycopg.rows'] = pg3.rows
`;
