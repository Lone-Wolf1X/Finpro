-- Fix duplicate ledger accounts (merge into oldest)
DO $$
DECLARE
    r RECORD;
    keeper_id BIGINT;
BEGIN
    -- Loop through duplicates
    FOR r IN 
        SELECT account_name, owner_id 
        FROM ledger_accounts 
        GROUP BY account_name, owner_id 
        HAVING COUNT(*) > 1 
    LOOP
        -- Identify keeper (oldest)
        SELECT id INTO keeper_id 
        FROM ledger_accounts 
        WHERE account_name = r.account_name 
          AND owner_id IS NOT DISTINCT FROM r.owner_id 
        ORDER BY id ASC 
        LIMIT 1;
        
        RAISE NOTICE 'Merging duplicates for % (Owner: %) into ID %', r.account_name, r.owner_id, keeper_id;

        -- Update transactions (Debit)
        UPDATE ledger_transactions 
        SET debit_account_id = keeper_id 
        WHERE debit_account_id IN (
            SELECT id FROM ledger_accounts 
            WHERE account_name = r.account_name 
              AND owner_id IS NOT DISTINCT FROM r.owner_id 
              AND id != keeper_id
        );

        -- Update transactions (Credit)
        UPDATE ledger_transactions 
        SET credit_account_id = keeper_id 
        WHERE credit_account_id IN (
            SELECT id FROM ledger_accounts 
            WHERE account_name = r.account_name 
              AND owner_id IS NOT DISTINCT FROM r.owner_id 
              AND id != keeper_id
        );
        
        -- Update accounts referenced by other tables if necessary?
        -- No other references to ledger_accounts in V17 (except transactions)
        
        -- Delete duplicates
        DELETE FROM ledger_accounts 
        WHERE account_name = r.account_name 
          AND owner_id IS NOT DISTINCT FROM r.owner_id 
          AND id != keeper_id;
    END LOOP;
END $$;
