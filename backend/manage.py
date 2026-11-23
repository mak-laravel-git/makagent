"""Operator commands; never pass provider secrets through chat or URL parameters."""
import argparse, getpass, os, sqlite3
from .core import Settings,DB,create_owner,PASSWORDS

def main():
    p=argparse.ArgumentParser(description='MakAgent connection service operator tools')
    p.add_argument('command',choices=['init','create-owner','set-password']);p.add_argument('--email');args=p.parse_args()
    cfg=Settings.load().prepare();db=DB(cfg)
    if args.command=='init':print('Database and encryption key ready. Create an owner next.');return
    email=(args.email or input('Owner email: ')).strip().lower()
    password=os.getenv('MAKAGENT_OWNER_PASSWORD') or getpass.getpass('Unique password (at least 14 characters): ')
    if not 14<=len(password)<=256:raise SystemExit('Password must be 14–256 characters.')
    if args.command=='create-owner':
        try:create_owner(db,email,password)
        except (ValueError,sqlite3.IntegrityError) as e:raise SystemExit('Owner not created. Check email format or whether it already exists.') from None
        print('Owner created. Sign in on /app/connections.html. No demo password is accepted.')
    else:
        with db.open(True) as c:
            row=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()
            if not row:raise SystemExit('Account does not exist.')
            user=row['id'];c.execute('UPDATE users SET password_hash=? WHERE id=?',(PASSWORDS.hash(password),user))
            for table in ('sessions','oauth_states','pending'):c.execute(f'DELETE FROM {table} WHERE user_id=?',(user,))
        print('Password updated; all sessions and pending authorizations revoked. Stored provider connections remain.')
if __name__=='__main__':main()
