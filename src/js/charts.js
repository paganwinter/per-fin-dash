// const incColors = ['#009900', '#00cc00', '#00ff00', '#33ff33', '#66ff66']
// const expColors = ['#990000', '#cc0000', '#ff0000', '#ff3333', '#ff6666']
// const assColors = ['#000099', '#0000cc', '#0000ff', '#3333ff', '#6666ff']

const incColors = ['#008000', '#009900', '#00b300', '#00cc00', '#00e600', '#00ff00', '#1aff1a', '#33ff33', '#4dff4d', '#66ff66', '#80ff80', '#99ff99', '#b3ffb3', '#ccffcc']
const expColors = ['#800000', '#990000', '#b30000', '#cc0000', '#e60000', '#ff0000', '#ff1a1a', '#ff3333', '#ff4d4d', '#ff6666', '#ff8080', '#ff9999', '#ffb3b3', '#ffcccc'].reverse()
const assColors = ['#000080', '#000099', '#0000b3', '#0000cc', '#0000e6', '#0000ff', '#1a1aff', '#3333ff', '#4d4dff', '#6666ff', '#8080ff', '#9999ff', '#b3b3ff', '#ccccff'].reverse()

const incColor = '#00ff00'
const expColor = '#ff0000'
const assColor = '#0000ff'


function drawSummaryChart(el, data, accountsList) {
  data = data.slice().reverse()

  const seriesMap = {}

  Object.entries(accountsList.inc).forEach(([id, acct], i) => {
    seriesMap[id] = {
      name: id,
      type: 'column',
      data: [],
      stack: 'stack1',
      // color: incColors[i],
      color: incColor,
      visible: false, // (id === 'inc-unknown'),
    }
  })
  Object.entries(accountsList.exp).forEach(([id, acct], i) => {
    seriesMap[id] = {
      name: id,
      type: 'column',
      data: [],
      stack: 'stack1',
      // color: expColors[i],
      color: expColor,
      visible: false, // (id === 'exp-unknown'),
    }
  })
  Object.entries(accountsList.ass).forEach(([id, acct], i) => {
    seriesMap[id] = {
      name: id,
      type: 'column',
      data: [],
      stack: 'stack2',
      // color: assColors[i],
      color: assColor,
      visible: false,
    }
  })

  seriesMap.income = {
    name: 'income',
    type: 'column',
    data: [],
    stack: 'stack1',
    color: incColor,
    visible: true,
  }
  seriesMap.expense = {
    name: 'expenses',
    type: 'column',
    data: [],
    stack: 'stack2',
    color: expColor,
    visible: true,
  }
  seriesMap.savings = {
    name: 'savings',
    type: 'column',
    data: [],
    stack: 'stack2',
    color: assColor,
    visible: true,
  }

  const periods = []
  data.forEach(d => {
    periods.push(d.period)

    for (let id in d.accountsList.inc) {
      seriesMap[id].data.push(-1 * d.accountsList.inc[id].total) // invert income values
    }
    for (let id in d.accountsList.exp) {
      seriesMap[id].data.push(d.accountsList.exp[id].total)
    }
    for (let id in d.accountsList.ass) {
      seriesMap[id].data.push(d.accountsList.ass[id].total)
    }

    seriesMap.income.data.push(-1 * d.accountsTree.inc.inc.total)
    seriesMap.expense.data.push(d.accountsTree.exp.exp.total)
    seriesMap.savings.data.push(d.accountsTree.ass.ass.total)
  })

  const series = Object.values(seriesMap)


  Highcharts.chart(el, {
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Income, Expense, Asset'
    },
    // subtitle: { text: '' },
    xAxis: {
      categories: periods,
      // crosshair: true
    },
    yAxis: {
      labels: {
        // format: '{value} Rs.',
        // formatter() { return fmtAmt(this.value / 1000, 0) + 'k' },
        formatter() { return (this.value / 1000) + 'k' },
        style: { color: Highcharts.getOptions().colors[1] },
      },
      title: {
        text: 'Amount',
        style: { color: Highcharts.getOptions().colors[1] }
      }
    },
    tooltip: {
      shared: true
    },
    legend: {
      // layout: 'vertical',
      // align: 'left',
      // x: 120,
      // verticalAlign: 'top',
      // y: 10,
      // floating: true,
      // backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'rgba(255,255,255,0.25)',
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        pointPadding: 0,
        borderWidth: 0,
        groupPadding: 0.00,
        shadow: false,
        marker: { enabled: false, symbol: 'circle', radius: 2 },
      },
      line: {
        marker: { enabled: false, symbol: 'circle', radius: 2 },
      },
      area: {
        stacking: 'normal',
      },
    },
    series,
	});
}


function drawNetworthChart(el, data, accountsList) {
  data = data.slice().reverse()

  const periods = []
  const seriesMap = {
    // _total_: {},
  }

  Object.entries(accountsList.ass).forEach(([id, acct], i) => {
    seriesMap[id] = {
      name: id,
      type: 'area',
      data: [],
      stack: 'stack1',
      step: 'center',
      color: assColors[i],
      visible: false,
    }
  })
  seriesMap.total = {
    name: 'total',
    type: 'area',
    data: [],
    stack: 'stack2',
    step: 'center',
    color: 'black',
    visible: true,
  }


  data.forEach((d, periodIdx) => {
    periods.push(d.period)
    const prevPeriod = data[periodIdx - 1]

    let totalAssets = 0
    for (let id in d.balances.ass) {
      seriesMap[id].data.push(d.balances.ass[id].balance)
      totalAssets += d.balances.ass[id].balance
    }
    seriesMap.total.data.push(totalAssets)
  })
  // console.log(seriesMap)

  const series = Object.values(seriesMap)
  // console.log(series)

  Highcharts.chart(el, {
    chart: {
      zoomType: 'x',
    },
    title: {
      text: 'Net Worth'
    },
    yAxis: {
      labels: {
        // format: '{value} Rs.',
        // formatter() { return fmtAmt(this.value / 1000, 0) + 'k' },
        formatter() { return (this.value / 1000) + 'k' },
        style: { color: Highcharts.getOptions().colors[1] },
      },
      title: {
        text: 'Amount',
        style: { color: Highcharts.getOptions().colors[1] }
      }
    },
    tooltip: {
      shared: true
    },
    legend: {
      // layout: 'vertical',
      // align: 'left',
      // x: 120,
      // verticalAlign: 'top',
      // y: 10,
      // floating: true,
      // backgroundColor: Highcharts.defaultOptions.legend.backgroundColor || 'rgba(255,255,255,0.25)',
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        lineWidth: 0,
        pointPadding: 0,
        borderWidth: 0,
        // groupPadding: 0.05,
        shadow: false,
        marker: { enabled: false, symbol: 'circle', radius: 2 },
      },
    },
    xAxis: {
      categories: periods,
    },
    series,
  })
}
