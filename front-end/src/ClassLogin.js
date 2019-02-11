import React, { Component } from "react";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";

class ClassLogin extends Component {
  static propTypes = {
    login: PropTypes.func.isRequired,
    welcome: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.verify = this.verify.bind(this);
    this.login = this.login.bind(this);
    this.state = {
      notification: false,
      notificationText: "",
      notificationType: "",
      redirectToLogin: false,
      validClass: false,
      secret: "",
      id: "",
      redirectToHome: false
    };
  }
  verify(e) {
    e.preventDefault();
    this.setState({
      notification: true,
      notificationText: "Verifying....",
      notificationType: "notification is-info"
    });
    let formData = new FormData();
    formData.append("id", this.refs.id.value);
    formData.append("secret", this.refs.secret.value);
    fetch("/api/userverify", {
      method: "POST",
      body: formData
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                if (data["type"] === "pregen") {
                  this.setState({ redirectToLogin: true });
                } else {
                  if (data.active + 1 > data.max) {
                    this.setState({
                      notification: true,
                      notificationText: "This class is full!",
                      notificationType: "notification is-danger"
                    });
                  } else {
                    this.setState({
                      validClass: true,
                      secret: this.refs.secret.value,
                      id: this.refs.id.value,
                      notification: false
                    });
                  }
                }
              }.bind(this)
            );
          } else if (response.status === 400) {
            this.setState({
              notification: true,
              notificationText: "This class is not in session!",
              notificationType: "notification is-danger"
            });
          } else if (response.status === 404) {
            this.setState({
              notification: true,
              notificationText: "This class is not found!",
              notificationType: "notification is-danger"
            });
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  login(e) {
    e.preventDefault();
    this.setState({
      notification: true,
      notificationText: "Registering....",
      notificationType: "notification is-info"
    });
    let formData = new FormData();
    formData.append("email", this.refs.email.value);
    formData.append("first", this.refs.firstName.value);
    formData.append("last", this.refs.lastName.value);
    formData.append("company", this.refs.company.value);
    formData.append("title", this.refs.title.value);
    formData.append("password", this.refs.password.value);
    formData.append("secret", this.state.secret);
    formData.append("id", this.state.id);

    if (this.props.userquestions) {
      formData.append("GPDR1", this.refs.GDPR1.checked);
      formData.append("GPDR2", this.refs.GDPR2.checked);
    } else {
      formData.append("GPDR1", false);
      formData.append("GPDR2", false);
    }

    fetch("/api/userregister", {
      method: "POST",
      body: formData
    })
      .then(
        function(data) {
          if (data.status === 200) {
            data.json().then(x => {
              this.props.login(x.token, x.role);
              this.setState({
                redirectToHome: true
              });
            });
          } else if (data.status === 400) {
            this.setState({
              notification: true,
              notificationText:
                "This user has already been registered. Please Login instead.",
              notificationType: "notification is-danger"
            });
          } else if (data.status === 401 || data.status === 403) {
            this.setState({
              notification: true,
              notificationText:
                "We can not verify this email. Please contact the administrator for more details.",
              notificationType: "notification is-danger"
            });
          }
        }.bind(this)
      )
      .catch(function(error) {
        console.log("Request failure: ", error);
      });
  }
  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    if (this.state.redirectToLogin === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.redirectToHome === true) {
      return <Redirect to="/" />;
    }

    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <h2 className="title">{this.props.welcome}</h2>
              <div className="column is-6 is-offset-3">
                <h4 className="title has-text-grey">Class Login</h4>
                <p className="subtitle has-text-grey">
                  Please login to proceed.
                </p>
                <div className="box">
                  {this.state.notification ? (
                    <div className={type}>{message}</div>
                  ) : null}
                  {this.state.validClass === false ? (
                    <form onSubmit={this.verify} method="post">
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Class ID</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input className="input" type="text" ref="id" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Class Secret Key</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                type="text"
                                ref="secret"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field">
                        <div className="control">
                          <button className="button is-block is-info is-large is-fullwidth">
                            Verify
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : null}
                  {this.state.validClass === true ? (
                    <form onSubmit={this.login} method="post">
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Email</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="email"
                                ref="email"
                                placeholder="Email input"
                                required
                                autoFocus
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">First Name</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="text"
                                placeholder="First"
                                ref="firstName"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Last Name</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="text"
                                placeholder="Last"
                                ref="lastName"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Company</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="text"
                                placeholder="Company"
                                ref="company"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Job Title</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="text"
                                placeholder="Employee"
                                ref="title"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Password</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="password"
                                placeholder=""
                                ref="password"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {this.props.userquestions ? (
                        <React.Fragment>
                          <div className="field is-horizontal">
                            <div className="field-label">
                              <label className="label" />
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <label className="checkbox">
                                    <input type="checkbox" ref="GDPR1" />
                                    {"  "}
                                    I would like to speak to a specialist.
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label">
                              <label className="label" />
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <label className="checkbox">
                                    <input type="checkbox" ref="GDPR2" />
                                    {"  "}
                                    Send me updates on threat research, news,
                                    and events.
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      ) : null}

                      <div className="field is-horizontal">
                        <p>
                          By submitting this form, you agree to our{" "}
                          <a href="https://www.paloaltonetworks.com/legal-notices/terms-of-use">
                            Terms of Use
                          </a>{" "}
                          and acknowledge our{" "}
                          <a href="https://www.paloaltonetworks.com/legal-notices/privacy">
                            Privacy Statement
                          </a>.
                        </p>
                      </div>

                      <div className="field is-horizontal">
                        <div className="control">
                          <button type="button submit" className="button">
                            Submit
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default ClassLogin;
