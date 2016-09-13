const React = window.React;
const $ = window.$;

const parseGameTable = ($table) => {
  let playerCol, rankCol, vpsCol;
  const date = $($table[0].previousSibling).text().trim();
  const $tbody = $table.find('tbody').first();
  $tbody.find('tr').first().find('td').each((i, td) => {
  });
  const players = [];
  $tbody.find('tr').each((rowIndex, tr) => {
    $(tr).find('td').each((colIndex, td) => {
      const text = $(td).text().toLowerCase().trim();
      if (text === 'player:') {
        playerCol = colIndex;
      } else if (text === 'rank:') {
        rankCol = colIndex;
      } else if (text === 'vps:') {
        vpsCol = colIndex;
      } else {

      }
    });
  });
  return { date, players, };
};

class App extends React.Component {
  componentWillMount() {
    $.get(`http://crossorigin.me/http://gokosalvager.com/logsearch?p1name=sarink&p1score=any&p2name=&startdate=08%2F05%2F2012&enddate=09%2F06%2F2016&supply=&nonsupply=&rating=any&pcount=any&colony=any&bot=any&shelters=any&guest=any&minturns=&maxturns=&quit=any&resign=any&limit=1000&submitted=true&offset=0`)
      .then((resp) => {
        window.resp = {resp};
        const $data = $('<div></div>').append($.parseHTML(resp));
        window.$data = $data;
        $data.find('table').each((i, table) => {
          const game = parseGameTable($(table));
          console.log('game', game);
        });
      });
  }
  render() {
    return <Title>Helloooo world!</Title>;
  }
}

class Title extends React.Component {
  render() {
    return <h1>{this.props.children}</h1>;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
