import React, { Component } from 'react';
import './App.css';
import firebase, { auth, googleProvider, facebookProvider } from './firebase';

function getProviderForProviderId(providerId) {
  if (providerId === 'google.com') {
    return googleProvider;
  } else if (providerId === 'facebook.com') {
    return facebookProvider;
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      currentItem: '',
      username: '',
      items: [],
      user: null
    }
    this.googleLogin = this.googleLogin.bind(this);
    this.facebookLogin = this.facebookLogin.bind(this);
    this.logout = this.logout.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const pendingCred = JSON.parse(localStorage.getItem('pendingCred'));
    if (pendingCred) {
      auth.getRedirectResult()
        .then((result) => {
          const token = firebase.auth.FacebookAuthProvider.credential(pendingCred);
          result.user.linkWithCredential(token)
            .then(() => {
              this.setState({
                user: result.user
              });
            })
        });
      localStorage.removeItem('pendingCred');
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user });
      }
    });

    const itemsRef = firebase.database().ref('items');
    itemsRef.on('value', (snapshot) => {
      const items = snapshot.val();
      let newState = [];

      for (let item in items) {
        newState.push({
          id: item,
          title: items[item].title,
          user: items[item].user
        });
      }

      this.setState({
        items: newState
      });
    });
  }

  googleLogin() {
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        const user = result.user;
        this.setState({
          user
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  facebookLogin() {
    auth.signInWithPopup(facebookProvider)
      .then((result) => {
        const user = result.user;
        console.log(user);
        this.setState({
          user
        });
      })
      .catch((error) => {
        if (error.code === 'auth/account-exists-with-different-credential') {
          localStorage.setItem('pendingCred', JSON.stringify(error.credential));
          const email = error.email;
          auth.fetchProvidersForEmail(email)
            .then((providers) => {
              if (providers[0] === 'password') {
                // prompt user for password
                console.log(providers);
                return;
              } else {
                const provider = getProviderForProviderId(providers[0]);
                // popup is blocked
                auth.signInWithRedirect(provider);

              }
            });
        }
      });
  }

  logout() {
    auth.signOut()
      .then(() => {
        this.setState({
          user: null
        });
      });
  }

  handleSubmit(e) {
    e.preventDefault();
    const itemsRef = firebase.database().ref('items');
    const item = {
      title: this.state.currentItem,
      user: this.state.user.displayName || this.state.user.email
    }
    itemsRef.push(item);
    this.setState({
      currentItem: '',
      username: ''
    });
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  removeItem(itemId) {
    const itemRef = firebase.database().ref(`/items/${itemId}`);
    itemRef.remove();
  }

  render() {
    return (
      <div className='app'>
        <header>
          <div className='wrapper'>
            <h1>Fun Food Friends</h1>
            {this.state.user ?
              <button onClick={this.logout}>Log Out</button>
              :
              <div>
                <button onClick={this.googleLogin}>Google Log In</button>
                <button onClick={this.facebookLogin}>Facebook Log In</button>
              </div>
            }
          </div>
        </header>
        {this.state.user ?
          <div>
            <div className='user-profile'>
              <img src={this.state.user.photoURL} />
            </div>
            <div className='container'>
              <section className='add-item'>
                <form onSubmit={this.handleSubmit}>
                  <input type="text" name="username" placeholder="What's your name?" defaultValue={this.state.user.displayName || this.state.user.email} />
                  <input type="text" name="currentItem" placeholder="What are you bringing?" onChange={this.handleChange} value={this.state.currentItem} />
                  <button>Add Item</button>
                </form>
              </section>
              <section className='display-item'>
                <div className="wrapper">
                  <ul>
                    {this.state.items.map((item) => {
                      return (
                        <li key={item.id}>
                          <h3>{item.title}</h3>
                          <p>brought by: {item.user}
                            {item.user === this.state.user.displayName || item.user === this.state.user.email ?
                              <button onClick={() => this.removeItem(item.id)}>Remove Item</button> : null}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            </div>
          </div>
          :
          <div className='wrapper'>
            <p>You must be logged in to see the potluck list and submit to it.</p>
          </div>
        }
      </div>
    );
  }
}

export default App;
