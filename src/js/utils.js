function xlsDate(num) {
  // https://stackoverflow.com/questions/16229494/converting-excel-date-serial-number-to-date-using-javascript
  // https://stackoverflow.com/a/22352911
  return new Date(Math.round((num - 25569) * 86400 * 1000) - (5.5 * 3600 * 1000))
}

function num(val) {
  // return parseFloat(val).toPrecision(2)
  return +(val.toFixed(2))
}

function fmtAmt(amount = 0, dec = 2) {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: dec })
}

function sortObj(unorderedObj) {
  const orderedObj = Object.keys(unorderedObj)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unorderedObj[key]
      return obj
    }, {})
  return orderedObj
}

function obj2arr(obj) {
  return Object.entries(obj).map(([key, val]) => ({ key, val }))
}
