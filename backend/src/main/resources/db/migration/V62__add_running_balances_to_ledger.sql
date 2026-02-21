-- V62__add_running_balances_to_ledger.sql
ALTER TABLE ledger_transactions
ADD COLUMN debit_balance_after DECIMAL(19, 2),
    ADD COLUMN credit_balance_after DECIMAL(19, 2);
COMMENT ON COLUMN ledger_transactions.debit_balance_after IS 'Running balance of the debit account after this transaction';
COMMENT ON COLUMN ledger_transactions.credit_balance_after IS 'Running balance of the credit account after this transaction';