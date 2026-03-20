
from sqlalchemy import text
from app.database import engine

def apply_fix():
    print("Connecting to database...")
    with engine.connect() as conn:
        print("Adding merchant_upi column if missing...")
        conn.execute(text('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_upi VARCHAR(255)'))
        conn.commit()
        print("Column added successfully.")
        
        # Verify
        from sqlalchemy import inspect
        insp = inspect(engine)
        cols = [c['name'] for c in insp.get_columns('transactions')]
        print(f"Transactions columns: {cols}")
        if 'merchant_upi' in cols:
            print("VERIFICATION SUCCESS: merchant_upi exists.")
        else:
            print("VERIFICATION FAILED: merchant_upi missing.")

if __name__ == "__main__":
    apply_fix()
