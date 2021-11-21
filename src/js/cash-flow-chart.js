function drawCashFlow(el, data) {
  console.log(data.accountsTree)
  document.getElementById(el).innerHTML = ''

  const txns = []
  const nodes = []

  nodes.push({ id: 'inc', name: 'inc', perc: 100, total: data.accountsTree.inc.inc.total })
  nodes.push({ id: 'exp', name: 'exp', perc: data.aggregate.exp.perc, total: data.accountsTree.exp.exp.total })
  nodes.push({ id: 'ass', name: 'ass', perc: data.aggregate.ass.perc, total: data.accountsTree.ass.ass.total })

  txns.push({ from: 'inc', to: 'exp', value: data.accountsTree.exp.exp.total })
  txns.push({ from: 'inc', to: 'ass', value: data.accountsTree.ass.ass.total })

  for (let id in data.accountsTree.inc) {
    const acct = data.accountsTree.inc[id]
    if (acct.parent && acct.id.split('-').length < 3) {
      nodes.push({ id: acct.id, name: acct.id.split('-').slice(-1), perc: acct.perc, total: acct.total })
      txns.push({ from: acct.id, to: acct.parent, value: -acct.total })
    }
  }

  for (let id in data.accountsTree.exp) {
    const acct = data.accountsTree.exp[id]
    if (acct.parent && acct.id.split('-').length < 4) {
      nodes.push({ id: acct.id, name: acct.id.split('-').slice(-1), perc: acct.perc, total: acct.total })
      txns.push({ from: acct.parent, to: acct.id, value: acct.total })
    }
  }
  for (let id in data.accountsTree.ass) {
    const acct = data.accountsTree.ass[id]
    if (acct.parent && acct.id.split('-').length < 10) {
      nodes.push({ id: acct.id, name: acct.id.split('-').slice(-1), perc: acct.perc, total: acct.total })
      txns.push({ from: acct.parent, to: acct.id, value: acct.total })
    }
  }

  am5.ready(function () {
    // https://www.amcharts.com/docs/v5/charts/flow-charts/sankey-diagram/

    // Create root element - https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new(el);

    // Set themes - https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root)]);

    // Create series - https://www.amcharts.com/docs/v5/charts/flow-charts/
    var series = root.container.children.push(
      am5flow.Sankey.new(root, {
        // orientation: 'vertical',
        sourceIdField: 'from',
        targetIdField: 'to',
        valueField: 'value',

        paddingRight: 100,
        nodeWidth: 10,
        nodePadding: 2,
        nodeAlign: 'left',
        // nodeAlign: 'justify',
        linkTension: 0.5,
      })
    );
    series.links.template.setAll({
      fillStyle: 'target'
    });
    series.nodes.labels.template.setAll({ text: '[bold]{name}[/]: {perc}%' });
    series.nodes.rectangles.template.setAll({ tooltipText: '[bold]{name}[/]: {total} {perc}%' });
    series.links.template.setAll({ tooltipText: '{sourceId}[/] -> {targetId}: [bold]{value}[/]' });
    // series.nodes.get('colors').set('step', 2);

    // Set data - https://www.amcharts.com/docs/v5/charts/flow-charts/#Setting_data
    series.nodes.setAll({ idField: 'id', nameField: 'name' });
    series.nodes.data.setAll(nodes);

    series.data.setAll(txns);

    // Make stuff animate on load
    series.appear(1000, 100);
  }); // end am5.ready()
}


function drawCashFlow2(el, data, type) {
  console.log(data.accountsTree)
  document.getElementById(el).innerHTML = ''

  const txns = []
  const nodes = []

  // nodes.push({ id: 'inc', name: 'inc', perc: 100, total: data.accountsTree.inc.inc.total })
  // nodes.push({ id: 'exp', name: 'exp', perc: data.aggregate.exp.perc, total: data.accountsTree.exp.exp.total })
  // nodes.push({ id: 'ass', name: 'ass', perc: data.aggregate.ass.perc, total: data.accountsTree.ass.ass.total })

  // txns.push({ from: 'inc', to: 'exp', value: data.accountsTree.exp.exp.total })
  // txns.push({ from: 'inc', to: 'ass', value: data.accountsTree.ass.ass.total })


  nodes.push({ id: type, name: type, perc: data.aggregate[type].perc, total: data.accountsTree[type][type].total })

  for (let id in data.accountsTree[type]) {
    const acct = data.accountsTree[type][id]
    if (acct.parent) {
      const total = (type === 'inc') ? -acct.total : acct.total
      nodes.push({ id: acct.id, name: acct.id.split('-').slice(-1), perc: acct.perc, total })
      txns.push({ from: acct.parent, to: acct.id, value: total })
    }
  }

  am5.ready(function () {
    // https://www.amcharts.com/docs/v5/charts/flow-charts/sankey-diagram/

    // Create root element - https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new(el);

    // Set themes - https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root)]);

    // Create series - https://www.amcharts.com/docs/v5/charts/flow-charts/
    var series = root.container.children.push(
      am5flow.Sankey.new(root, {
        orientation: 'vertical',
        sourceIdField: 'from',
        targetIdField: 'to',
        valueField: 'value',

        paddingRight: 100,
        nodeWidth: 10,
        nodePadding: 2,
        nodeAlign: 'left',
        // nodeAlign: 'justify',
        linkTension: 0.5,
      })
    );
    series.links.template.setAll({
      fillStyle: 'target'
    });
    series.nodes.labels.template.setAll({ text: '[bold]{name}[/]: {perc}%' });
    series.nodes.rectangles.template.setAll({ tooltipText: '[bold]{name}[/]: {total} {perc}%' });
    series.links.template.setAll({ tooltipText: '{sourceId}[/] -> {targetId}: [bold]{value}[/]' });
    // series.nodes.get('colors').set('step', 2);

    // Set data - https://www.amcharts.com/docs/v5/charts/flow-charts/#Setting_data
    series.nodes.setAll({ idField: 'id', nameField: 'name' });
    series.nodes.data.setAll(nodes);

    series.data.setAll(txns);

    // Make stuff animate on load
    series.appear(1000, 100);
  }); // end am5.ready()
}
