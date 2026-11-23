from __future__ import annotations
import os, json, sqlite3, secrets, hashlib, time, contextlib, re
from pathlib import Path
from dataclasses import dataclass, field
from urllib.parse import urlsplit
from cryptography.fernet import Fernet
from argon2 import PasswordHasher
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
PASSWORDS = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
def now(): return int(time.time())
def digest(value): return hashlib.sha256(value.encode()).hexdigest()

def secret_file(path, value):
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as f: f.write(value)
    except FileExistsError: pass
    return path.read_text().strip()

@dataclass
class Settings:
    data_dir: Path
    public_url: str = 'http://localhost:8082'
    production: bool = False
    key: str = ''
    values: dict = field(default_factory=dict)
    @classmethod
    def load(cls):
        load_dotenv(ROOT / '.env', override=False)
        return cls(Path(os.getenv('SALESPILOT_DATA_DIR', str(Path.home()/'.local/share/salespilot-live'))), os.getenv('PUBLIC_BASE_URL','http://localhost:8082').rstrip('/'), os.getenv('APP_ENV','development')=='production', os.getenv('TOKEN_ENCRYPTION_KEY',''), dict(os.environ))
    def prepare(self):
        self.data_dir = self.data_dir.expanduser().resolve()
        self.data_dir.mkdir(parents=True, exist_ok=True)
        try: self.data_dir.chmod(0o700)
        except OSError: pass
        u = urlsplit(self.public_url)
        try:u.port
        except ValueError:raise RuntimeError('PUBLIC_BASE_URL has an invalid port.') from None
        if u.scheme not in ('http','https') or not u.hostname or u.username or u.password or u.path not in ('','/') or u.query or u.fragment:
            raise RuntimeError('PUBLIC_BASE_URL must be an origin, without credentials, path or query.')
        if self.production and (u.scheme!='https' or not self.key):
            raise RuntimeError('Production requires HTTPS PUBLIC_BASE_URL and TOKEN_ENCRYPTION_KEY.')
        if not self.production and u.scheme=='http' and u.hostname not in ('localhost','127.0.0.1','[::1]','::1'):
            raise RuntimeError('Plain HTTP is allowed only for local development.')
        if not self.key:
            self.key = secret_file(self.data_dir/'token.key', Fernet.generate_key().decode())
        self.fernet = Fernet(self.key.encode())
        return self
    def env(self, key): return self.values.get(key, '').strip()
    def callback(self, provider): return self.public_url + '/api/oauth/' + provider + '/callback'
    @property
    def cookie(self): return '__Host-salespilot_session' if self.production else 'salespilot_session'
    def encrypt(self, value): return self.fernet.encrypt(json.dumps(value,separators=(',',':')).encode()).decode()
    def decrypt(self, value): return json.loads(self.fernet.decrypt(value.encode()))

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_states(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,session_hash TEXT NOT NULL,provider TEXT NOT NULL,sealed TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS pending(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,session_hash TEXT NOT NULL,sealed TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS connections(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider TEXT NOT NULL,external_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,sealed TEXT NOT NULL,expires_at INTEGER,last_verified INTEGER NOT NULL,created_at INTEGER NOT NULL,error_code TEXT,UNIQUE(user_id,provider,external_id));
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL,action TEXT NOT NULL,provider TEXT,connection_id TEXT,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS connections_owner ON connections(user_id);
CREATE INDEX IF NOT EXISTS events_owner ON events(user_id,id);
'''
class DB:
    def __init__(self, cfg):
        self.path = cfg.data_dir/'connections.sqlite3'
        with self.open() as c:
            version=c.execute('PRAGMA user_version').fetchone()[0]
            if version not in (0,1): raise RuntimeError('Unsupported database schema; migrate before starting.')
            c.executescript(SCHEMA);c.execute('PRAGMA user_version=1')
        try: self.path.chmod(0o600)
        except OSError: pass
    @contextlib.contextmanager
    def open(self, transaction=False):
        c=sqlite3.connect(self.path,timeout=10);c.row_factory=sqlite3.Row
        c.execute('PRAGMA foreign_keys=ON');c.execute('PRAGMA secure_delete=ON')
        try:
            if transaction:c.execute('BEGIN IMMEDIATE')
            yield c
            c.commit()
        except BaseException:c.rollback();raise
        finally:c.close()
    def prune(self):
        with self.open() as c:
            for t in ('sessions','oauth_states','pending','limits'):c.execute(f'DELETE FROM {t} WHERE expires_at < ?',(now(),))
    def limit(self, key, count, seconds):
        with self.open(True) as c:
            r=c.execute('SELECT * FROM limits WHERE key=?',(key,)).fetchone()
            n=(r['count'] if r and r['expires_at']>now() else 0)+1
            expiry=r['expires_at'] if r and r['expires_at']>now() else now()+seconds
            c.execute('INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,expires_at=excluded.expires_at',(key,n,expiry))
        return n<=count
    def event(self,user,action,provider=None,connection_id=None):
        with self.open() as c:c.execute('INSERT INTO events(user_id,action,provider,connection_id,created_at) VALUES(?,?,?,?,?)',(user,action,provider,connection_id,now()))

def create_owner(db, email, password):
    email=email.strip().lower()
    if len(email)>254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):raise ValueError('Use a valid email address.')
    if not 14<=len(password)<=256:raise ValueError('Password must have 14–256 characters. Use a unique passphrase.')
    with db.open(True) as c:c.execute('INSERT INTO users VALUES(?,?,?,?)',(secrets.token_hex(16),email,PASSWORDS.hash(password),now()))
