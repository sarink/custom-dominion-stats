const React = window.React;
const $ = window.$;

class App extends React.Component {
  componentWillMount() {
    $.get('/logs/', { numPlayers: 2, }).then((resp) => {
      console.log(resp);
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
