import React, { Component } from "react";
import LabPicker from "./Utils/LabPicker";
import PropTypes from "prop-types";
import { LinkContainer } from "react-router-bootstrap";
import TokenContainer from "./Student/components/TokenContainer";

class Request extends Component {
  static propTypes = {
    welcome: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.requestFunc = this.requestFunc.bind(this);
    this.changeLab = this.changeLab.bind(this);

    this.state = {
      selectedLab: {},
      notification: false,
      notificationText: "",
      notificationType: "",
      redir: false
    };
  }
  changeLab(lab) {
    this.setState({ selectedLab: lab });
  }
  requestFunc(e) {
    e.preventDefault();
    this.setState({
      notification: true,
      notificationText: "Request Submitting....",
      notificationType: "notification is-info"
    });
    let formData = new FormData();
    formData.append("email", this.refs.email.value);
    formData.append("first", this.refs.firstName.value);
    formData.append("last", this.refs.lastName.value);
    if (this.props.seat) {
      formData.append("seatNumber", this.refs.seatNumber.value);
    } else {
      formData.append("seatNumber", null);
    }
    formData.append("lab", JSON.stringify(this.state.selectedLab));
    if (this.props.userquestions) {
      formData.append("GPDR1", this.refs.GDPR1.checked);
      formData.append("GPDR2", this.refs.GDPR2.checked);
    } else {
      formData.append("GPDR1", false);
      formData.append("GPDR2", false);
    }

    if (this.state.selectedLab && this.state.selectedLab.type === "qwiklab") {
      formData.append("tag", this.refs.form.refs.tag.value);
      formData.append("number", this.refs.form.refs.number.value);
      formData.append(
        "expiration",
        this.refs.form.refs.expiration.state.inputValue
      );
    }

    fetch("/api/request", {
      method: "POST",
      body: formData
    })
      .then(
        function(data) {
          if (data.status === 200) {
            this.setState({
              notification: true,
              notificationText:
                "The request has been successfully submitted. Please check your email for your login credentials and then click the link below to login.",
              notificationType: "notification is-success",
              redir: true
            });
          } else if (data.status === 403) {
            this.setState({
              notification: true,
              notificationText: "Too Many Requests!",
              notificationType: "notification is-danger"
            });
          } else if (data.status === 401) {
            this.setState({
              notification: true,
              notificationText:
                "We can not verify this email. Please contact the administrator for more details.",
              notificationType: "notification is-danger"
            });
          } else {
            this.setState({
              notification: true,
              notificationText:
                "An error has occured submitting the request. Please Try again. If the error persists please contact the administrator.",
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
    const { selectedLab } = this.state;
    return (
      <section className="hero is-fullheight">
        <div className="container has-text-centered">
          <div className="column is-8 is-offset-2">
            <div className="box">
              <h2 className="title">{this.props.welcome}</h2>
              {this.state.notification ? (
                <div className={type}>{message}</div>
              ) : null}
              {!this.state.redir ? (
                <form onSubmit={this.requestFunc} method="post">
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
                      <label className="label">Lab</label>
                    </div>
                    <div className="field-body">
                      <div className="field">
                        <div className="control ">
                          <LabPicker
                            changeLab={this.changeLab}
                            all={true}
                            lab={{}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedLab && selectedLab.type === "qwiklab" && (
                    <TokenContainer ref="form" />
                  )}

                  {this.props.seat ? (
                    <React.Fragment>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Seat Number</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="number"
                                placeholder="1"
                                ref="seatNumber"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ) : null}
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
                                <input
                                  type="checkbox"
                                  ref="GDPR1"
                                  name="GDPR1"
                                />
                                {"  "}I would like to speak to a specialist.
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
                                <input
                                  type="checkbox"
                                  ref="GDPR2"
                                  name="GDPR2"
                                />
                                {"  "}
                                Send me updates on threat research, news, and
                                events.
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
                      </a>
                      .
                    </p>
                  </div>

                  <div className="field is-horizontal">
                    <div className="control">
                      <button type="button submit" className="button">
                        Submit Request
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  {this.state.selectedLab.type === "qwiklab_one" ? (
                    <a
                      className="button is-link"
                      href="https://paloaltonetworks.qwiklabs.com/"
                    >
                      Login
                    </a>
                  ) : (
                    <div>
                      {this.state.selectedLab.type !== "cloudshare" ? (
                        <LinkContainer to="/login">
                          <a className="button is-link">Login</a>
                        </LinkContainer>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default Request;
