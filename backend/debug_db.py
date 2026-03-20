
from app.database import engine
from sqlalchemy import text

def debug():
    with engine.connect() as conn:
        print('--- USERS ---')
        users = conn.execute(text('SELECT id, email, role, company_id FROM users')).fetchall()
        for u in users: print(u)
        
        print('\n--- WALLETS ---')
        wallets = conn.execute(text('SELECT id, user_id, balance, company_id FROM wallets')).fetchall()
        for w in wallets: print(w)
        
        print('\n--- COMPANIES ---')
        companies = conn.execute(text('SELECT id, name FROM companies')).fetchall()
        for c in companies: print(c)
        
        print('\n--- TRANSACTIONS ---')
        txns = conn.execute(text('SELECT id, company_id, amount, status FROM transactions')).fetchall()
        print(f"Total Transactions: {len(txns)}")
        for t in txns: print(t)

if __name__ == "__main__":
    debug()
