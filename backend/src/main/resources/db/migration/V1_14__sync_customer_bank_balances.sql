-- Sync customer bank account balances from ledger transactions
-- This fixes existing customers whose balances are zero but have transactions

UPDATE customer_bank_accounts cba
SET balance = COALESCE((
    SELECT SUM(
        CASE 
            WHEN lt.transaction_type IN ('DEPOSIT', 'REVERSAL', 'SETTLEMENT') THEN lt.amount
            WHEN lt.transaction_type IN ('WITHDRAWAL', 'FEE', 'TRANSFER', 'ALLOTMENT') THEN -lt.amount
            ELSE 0
        END
    )
    FROM ledger_transactions lt
    WHERE lt.customer_bank_account_id = cba.id
      AND lt.status = 'COMPLETED'
), 0)
WHERE cba.balance = 0
  AND EXISTS (
      SELECT 1 
      FROM ledger_transactions lt 
      WHERE lt.customer_bank_account_id = cba.id
  );
