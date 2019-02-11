import React, { Component } from "react";
import PropTypes from "prop-types";
import base64 from "base-64";
import { Redirect } from "react-router-dom";

export class LoginContainer extends Component {
  static propTypes = {
    login: PropTypes.func.isRequired,
    welcome: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.loginFunc = this.loginFunc.bind(this);

    this.state = {
      notification: false,
      notificationText: "",
      notificationType: "",
      redirectToReferrer: false
    };
  }

  loginFunc(e) {
    e.preventDefault();
    this.setState({
      notification: true,
      notificationText: "Submitting....",
      notificationType: "notification is-info"
    });
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " +
        base64.encode(this.refs.email.value + ":" + this.refs.password.value)
    );

    fetch("/api/login", {
      method: "GET",
      headers: headers
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.props.login(data.token, data.role);
                this.setState({
                  redirectToReferrer: true
                });
              }.bind(this)
            );
          } else if (response.status === 403) {
            this.setState({
              notification: true,
              notificationText: "This user has expired!",
              notificationType: "notification is-danger"
            });
          } else if (response.status === 401) {
            this.setState({
              notification: true,
              notificationText: "The username or password is incorrect.",
              notificationType: "notification is-danger"
            });
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }

  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    const { from } = this.props.location.state || { from: { pathname: "/" } };
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer === true) {
      return <Redirect to={from} />;
    }

    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <h2 className="title">{this.props.welcome}</h2>
              <div className="column is-4 is-offset-4">
                <h4 className="title has-text-grey">Login</h4>
                <p className="subtitle has-text-grey">
                  Please login to proceed.
                </p>
                <div className="box">
                  {this.state.notification ? (
                    <div className={type}>{message}</div>
                  ) : null}
                  <form onSubmit={this.loginFunc} method="post">
                    <div className="field">
                      <div className="control">
                        <input
                          className="input is-large"
                          name="email"
                          type="text"
                          ref="email"
                          id="inputEmail"
                          placeholder="Email address"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <input
                          className="input is-large"
                          name="item"
                          type="password"
                          ref="password"
                          id="inputPassword"
                          placeholder="Password"
                          required
                        />
                      </div>
                    </div>
                    <div className="field">
                      <div className="control">
                        <button className="button is-block is-info is-large is-fullwidth">
                          Login
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
export default LoginContainer;
