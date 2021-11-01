// async function fetchRules(path) {
//   let rulesFile = await fetch(path)
//     .then(res => res.arrayBuffer())
//   const workbook = XLSX.read(new Uint8Array(rulesFile), { type: 'array' })
//   return workbook
// }


// function processRules(rulesFile) {
//   const rawRules = XLSX.utils.sheet_to_json(rulesFile.Sheets['rules'], {})
//   const rules = rawRules
//     .filter((r) => !r.disabled)
//     .map((r, i) => {
//       r.id = `${r.__rowNum__ + 1}`
//       if (r.date) r.date = xlsDate(r.date)
//       if (r.tags) r.tags = r.tags.split(',')
//       return r
//     })
//   return rules
// }
// function categoriseTxn(txn, rules) {
//   const rule = rules.find((r, i) => {
//     if (r.crdr && txn.crdr !== r.crdr) return false
//     if (r.minAmt && (txn.amt < r.minAmt)) return false
//     if (r.maxAmt && (txn.amt > r.maxAmt)) return false
//     if (r.startDate && (txn.txnDate.getTime() < r.startDate.getTime())) return false
//     if (r.endDate && (txn.txnDate.getTime() > r.endDate.getTime())) return false
//     if (r.date && (txn.txnDate.getTime() !== r.date.getTime())) return false
//     if (r.month && (txn.month !== r.month)) return false
//     if (r.year && (txn.year !== r.year)) return false
//     if (r.yearMonth && (txn.yearMonth !== r.yearMonth)) return false
//     if (r.desc && !(new RegExp(r.desc,  'i')).test(txn.desc)) return false
//     if (r.acct && (txn.acct !== r.acct)) return false
//     // if (r.kind && (txn.kind !== r.kind)) return false
//     // if (r.source && (txn.source !== r.source)) return false
//     return true
//   })
//   return rule
// }


async function fetchStatements(path) {
  let statementsFile = await fetch(path)
    .then(res => res.arrayBuffer())
  const workbook = XLSX.read(new Uint8Array(statementsFile), { type: 'array' })
  return workbook
}

function extractTxns(statementsFile) {
  let rawTxns = []
  const statements = XLSX.utils.sheet_to_json(statementsFile.Sheets['statements'], {})
    .filter(stmt => stmt.enabled)
    .map(stmt => stmt.name)
  console.log('statements:', statements)
  statements.forEach(stmt => {
    const sheet = statementsFile.Sheets[stmt]
    const txns = XLSX.utils.sheet_to_json(sheet, {})
      // .map(t => { return t })
    rawTxns = rawTxns.concat(txns)
  })
  return rawTxns
}

function getParentAccts(acct) {
  const acctParts = acct.id.split('-')
  const parAccts = []
  for (let i = 0, len = acctParts.length; i < len; i++) {
    const parAcct = {
      ...acct,
      id: acctParts.slice(0, i + 1).join('-'),
      parent: acctParts.slice(0, i).join('-'),
      level: i,
    }
    parAccts.push(parAcct)
  }
  return parAccts
}

function getDates(txns) {
  // calculate date ranges and stuff
  const startDate = txns[0].txnDate
  const endDate = txns[txns.length - 1].txnDate
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const startMonth = startDate.getMonth() + 1
  const endMonth = endDate.getMonth() + 1
  const years = []
  const months = []
  for (let y = +startYear; y <= +endYear; y++) {
    years.push(`${y}`)
    for (let m = 1; m <= 12; m++) {
      const mm = (''+m).padStart(2, '0')
      months.push(`${y}-${mm}`)
    }
  }
  const dates = { years, months, startDate, endDate, startMonth, endMonth, startYear, endYear }
  return dates
}


function processTxns(rawTxns) {
  console.time('enrich txns')
  let allAccounts = {}
  let accountsList = {
    all: {},
  }

  let txns = rawTxns.map(rt => {
    const id = `${rt.__rowNum__ + 1}`
    const t = { ...rt }

    t.id = id

    t.desc = t.narration

    t.valDate = xlsDate(t.valDate)
    t.txnDate = xlsDate(t.txnDate)
    const yyyy = t.txnDate.getFullYear()
    const mm = (''+(t.txnDate.getMonth() + 1)).padStart(2, '0')
    t.month = `${mm}`
    t.year = `${yyyy}`
    t.yearMonth = `${yyyy}-${mm}`

    t.amt = t.credit || t.debit
    t.crdr = (t.credit) ? 'cr' : 'dr'

    t.tags = (t.tags) ? t.tags.split(',') : []




    // const rule = categoriseTxn(t, rules)
    // t.ruleId = (rule && rule.id) || '-'
    // t.tags = t.tags || (rule && rule.tags)

    t.tags = t.tags.reduce((obj, tag) => {
      obj[tag] = true
      return obj
    }, {})

    if (t.credit) {
      t.from = t.source || 'inc-unknown'
      t.to = t.acct
    } else {
      t.from = t.acct
      t.to = t.source || 'exp-unknown'
    }
    t.source = t.source || '-'


    // determine txn type
    t.type = '-'
    if (t.from.startsWith('ass-sb') && t.to.startsWith('ass-sb')) {
      t.type = 'xfr'
    }
    if (t.from.startsWith('ass') && t.to.startsWith('ass-inv')) {
      t.type = 'inv-out'
    }
    if (t.from.startsWith('ass-inv') && t.to.startsWith('ass')) {
      t.type = 'inv-in'
    }
    if (t.from.startsWith('ass') && t.to.startsWith('exp')) {
      t.type = 'exp'
    }
    if (t.from.startsWith('inc') && t.to.startsWith('ass')) {
      t.type = 'inc'
    }

    // add account to accounts list
    if (!accountsList.all[t.from]) accountsList.all[t.from] = { id: t.from, type: t.from.split('-')[0] }
    if (!accountsList.all[t.to]) accountsList.all[t.to] = { id: t.to, type: t.to.split('-')[0] }

    return t
  })


  // sort txns by date
  txns = txns.sort((a, b) => {
    if (a.txnDate < b.txnDate) return -1
    else if (a.txnDate > b.txnDate) return 1
    else return 0
  })


  // group accounts by type
  accountsList.all = sortObj(accountsList.all)
  for (let id in accountsList.all) {
    const acct = accountsList.all[id]
    const { type } = acct
    accountsList[type] = accountsList[type] || {}
    accountsList[type][acct.id] = { ...acct }
  }
  // console.log('accountsList', accountsList)



  // generate accounts tree
  let accountsTree = {
    all: {},
  }
  for (let id in accountsList.all) {
    const acct = accountsList.all[id]
    const parAccts = getParentAccts(acct)
    parAccts.forEach((parAcct) => {
      accountsTree.all[parAcct.id] = accountsTree.all[parAcct.id] || { ...parAcct }
    })
  }
  // group accounts by type
  for (let id in accountsTree.all) {
    const acct = { ...accountsTree.all[id] }
    accountsTree[acct.type] = accountsTree[acct.type] || {}
    accountsTree[acct.type][acct.id] = acct
  }
  // console.log('accountsTree', accountsTree)



  // calculate date ranges and stuff
  const dates = getDates(txns)

  console.timeEnd('enrich txns')

  return { txns, accountsList, accountsTree, dates }
}

function processStatements(statementsFile) {
  const rawTxns = extractTxns(statementsFile)
  const data = processTxns(rawTxns)
  return data
}

function filterTxns(txns, filters) {
  let filteredTxns = [...txns]
  const f = { ...filters }

  filteredTxns = filteredTxns.filter((txn) => {
    if (f.crdr && (txn.crdr !== f.crdr)) return false
    if (f.minAmt && (txn.amt < f.minAmt)) return false
    if (f.maxAmt && (txn.amt > f.maxAmt)) return false
    if (f.startDate && (txn.txnDate.getTime() < f.startDate.getTime())) return false
    if (f.endDate && (txn.txnDate.getTime() > f.endDate.getTime())) return false
    if (f.date && (txn.txnDate.getTime() !== f.endDate.getTime())) return false
    if (f.month && (txn.month !== f.month)) return false
    if (f.year && (txn.year !== f.year)) return false
    if (f.yearMonth && (txn.yearMonth !== f.yearMonth)) return false
    if (f.desc && !f.desc.test(txn.desc)) return false
    if (f.acct && (txn.acct !== f.acct)) return false
    if (f.source && (txn.source !== f.source)) return false
    if (f.from && (txn.from !== f.from)) return false
    if (f.to && (txn.to !== f.to)) return false
    if (f.type && (txn.type !== f.type)) return false
    if (f.tags && (!txn.tags[f.tags])) return false
    if (f.ruleId && (txn.ruleId !== f.ruleId)) return false
    return true
  })

  return filteredTxns
}


function calculateSummary(txns, accountsListMaster) {
  // total credits, debits, and balance
  const aggregate = {
    credits: 0,
    debits: 0,
    balance: 0,
  }

  // add ALL accounts to allAccts
  const accountsList = {
    all: {},
  }
  for (let type in accountsListMaster) {
    for (let id in accountsListMaster[type]) {
      const acct = accountsListMaster[type][id]
      accountsList.all[id] = { ...acct, txns: [], total: 0, in: 0, out: 0 }
    }
  }

  txns.forEach(t => {
    if (t.crdr === 'cr') {
      aggregate.credits = num(aggregate.credits + t.amt)
    } else {
      aggregate.debits = num(aggregate.debits + t.amt)
    }

    if (!t.tags.ignore) {
      accountsList.all[t.from].total = num(accountsList.all[t.from].total - t.amt)
      accountsList.all[t.to].total = num(accountsList.all[t.to].total + t.amt)

      // TODO: in-out
      // accountsList.all[t.from].out = num(accountsList.all[t.from].out + t.amt)
      // accountsList.all[t.to].in = num(accountsList.all[t.to].in + t.amt)
    }
  })

  aggregate.balance = aggregate.credits - aggregate.debits


  const tally = Object.values(accountsList.all)
    .map(a => a.total)
    .reduce((total, amt) => (num(total + amt)), 0)
  if (tally !== 0) return { error: new Error('tally is not zero') }


  // group accounts by type
  for (let id in accountsList.all) {
    const acct = accountsList.all[id]
    const { type } = acct
    accountsList[type] = accountsList[type] || {}
    accountsList[type][acct.id] = { ...acct }
  }
  // console.log('accountsList', accountsList)


  let accountsTree = {
    all: {},
  }
  for (let id in accountsList.all) {
    const acct = accountsList.all[id]
    const parAccts = getParentAccts(acct)
    parAccts.forEach((parAcct) => {
      accountsTree.all[parAcct.id] = accountsTree.all[parAcct.id] || { ...parAcct, total: 0 }
      accountsTree.all[parAcct.id].total = num(accountsTree.all[parAcct.id].total + acct.total)

      // TODO: in-out
      // accountsTree.all[parAcct.id].in = num(accountsTree.all[parAcct.id].in + acct.in)
      // accountsTree.all[parAcct.id].out = num(accountsTree.all[parAcct.id].out + acct.out)
    })
  }
  // group accounts by type
  for (let id in accountsTree.all) {
    const acct = { ...accountsTree.all[id] }
    accountsTree[acct.type] = accountsTree[acct.type] || {}
    accountsTree[acct.type][acct.id] = acct

    const acctTypeTotal = accountsTree[acct.type][acct.type].total
    if (acctTypeTotal) {
      accountsTree[acct.type][acct.id].perc = num(acct.total / acctTypeTotal * 100)
    } else {
      accountsTree[acct.type][acct.id].perc = 0
    }
  }
  // console.log(accountsTree)

  return { aggregate, accountsList, accountsTree }
}




function getMonthlySummary(txns, months, accountsList) {
  let summaries = []
  months.forEach((yearMonth, i) => {
    const filteredTxns = filterTxns(txns, { yearMonth })
    const summary = calculateSummary(filteredTxns, accountsList)
    if (summary.error) console.error(summary.error)

    const balances = {
      ass: {},
    }
    const prevPeriod = summaries[i - 1]
    for (let id in summary.accountsList.ass) {
      const acct = summary.accountsList.ass[id]
      balances.ass[acct.id] = { id: acct.id }
      const prevBal = (prevPeriod) ? prevPeriod.balances.ass[id].balance : 0
      const curTotal = acct.total
      balances.ass[acct.id].balance = num(prevBal + curTotal)
    }

    summaries.push({ period: yearMonth, ...summary, balances })
  })
  return summaries
}

function getYearlySummary(txns, years, accountsList) {
  let summaries = []
  years.forEach((year, i) => {
    const filteredTxns = filterTxns(txns, { year })
    const summary = calculateSummary(filteredTxns, accountsList)
    if (summary.error) console.error(summary.error)

    const balances = {
      ass: {},
    }
    const prevPeriod = summaries[i - 1]
    for (let id in summary.accountsList.ass) {
      const acct = summary.accountsList.ass[id]
      balances.ass[acct.id] = { id: acct.id }
      const prevBal = (prevPeriod) ? prevPeriod.balances.ass[id].balance : 0
      const curTotal = acct.total
      balances.ass[acct.id].balance = num(prevBal + curTotal)
    }

    summaries.push({ period: year, ...summary, balances })
  })
  return summaries
}


if (typeof exports !== 'undefined') {
  module.exports = {
    // processRules,
    // categoriseTxn,
    processStatements,
    extractTxns,
    processTxns,
    filterTxns,
    calculateSummary,
    getMonthlySummary,
    getYearlySummary,
  }
}
