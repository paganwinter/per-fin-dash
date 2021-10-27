# Personal Financ Dashboard

## Sample Dashboard
https://paganwinter.github.io/per-fin-dash/src/?stmtFile=/per-fin-dash/samples/statements-sample.xlsx


## Processing Statements
<!-- - read rules from rules.xlsx -->
- read txns from statements.xlsx
- enrich transactions
  - convert fields to JS types
  - identify source account for each txn
  - assign `from` and `to` accounts
  - identify txn type (inc, exp, xfer, etc.)
  - sort txns by txnDate
  - add accounts to accountsList
  - group accounts by type in accountsList
  - generate accounts tree from accountsList
  - calculate date ranges (start & end dates, months & years list, etc.)
- calculate monthly summary
- calculate yearly summary

## Calculating Summaries
for a given period range
- total credits
- total debits
- total difference
- accounts delta (total in - total out)
- accounts delta by account tree

# Reports
- Net Cashflow Statement
