import React, { Component } from "react";
import base64 from "base-64";
import { Redirect } from "react-router-dom";
import update from "immutability-helper";

import LabPicker from "../Utils/LabPicker";
import StudentRoles from "./components/StudentRoles";
class User extends Component {
  constructor(props) {
    super(props);
    this.saveEdit = this.saveEdit.bind(this);
    this.nameChange = this.nameChange.bind(this);
    this.durationChange = this.durationChange.bind(this);
    this.passwordChange = this.passwordChange.bind(this);

    this.state = {
      userId: this.props.match.params.email,
      password: "",
      user: { email: "", lab: {}, duration: 0, role: "" },
      notification: false,
      notificationText: "",
      notificationType: "",
      redirect: false,
      userLoaded: false
    };
  }
  getUser() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/users/" + this.state.userId, {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        this.setState({
          user: json,
          userLoaded: true
        });
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  componentDidMount() {
    if (!(this.state.userId === "new")) {
      this.getUser();
    } else {
      this.setState({
        userLoaded: true
      });
    }
  }
  saveEdit(e) {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    e.preventDefault();
    let formData = new FormData();
    formData.append("email", this.refs.email.value);
    formData.append("password", this.refs.password.value);
    formData.append("role", this.state.user.role);
    formData.append(
      "lab",
      this.state.user.role === "student"
        ? JSON.stringify(this.state.user.lab)
        : ""
    );
    formData.append(
      "duration",
      this.state.user.role === "student" ? this.refs.duration.value : 0
    );
    formData.append("expirationTime", "");

    let url = "";
    if (this.state.userId !== "new") url = "/" + this.state.userId;
    console.log(url);
    fetch("/api/users" + url, {
      method: "POST",
      body: formData,
      headers: headers
    })
      .then(
        function(data) {
          if (data.status === 200) {
            this.setState({
              notification: true,
              notificationText: "Successfully Updated.",
              notificationType: "notification is-success",
              redirect: true
            });
          } else {
            this.setState({
              notification: true,
              notificationText: "Error Saving.",
              notificationType: "notification is-danger"
            });
          }
        }.bind(this)
      )
      .catch(function(error) {
        console.log("Request failure: ", error);
      });
  }

  nameChange(event) {
    this.setState({
      user: update(this.state.user, {
        email: { $set: event.target.value }
      })
    });
  }
  passwordChange(event) {
    this.setState({
      password: event.target.value
    });
  }
  durationChange(event) {
    this.setState({
      user: update(this.state.user, {
        duration: { $set: event.target.value }
      })
    });
  }

  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    if (this.state.redirect === true) {
      return <Redirect to="/users" />;
    }
    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <div>
                <h2 className="title">User: {this.state.user.email}</h2>
                {this.state.notification ? (
                  <div className={type}>{message}</div>
                ) : null}
                <div className="column is-6 is-offset-3">
                  <div className="box">
                    <form
                      onSubmit={this.saveEdit}
                      method="post"
                      className="control"
                    >
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Email</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                type="text"
                                ref="email"
                                value={this.state.user.email}
                                onChange={this.nameChange}
                                disabled={this.state.userId !== "new"}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {this.state.userLoaded === true ? (
                        <React.Fragment>
                          {this.state.user.role === "student" ? (
                            <React.Fragment>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">Lab</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <LabPicker
                                        changeLab={x =>
                                          this.setState({
                                            user: update(this.state.user, {
                                              lab: { $set: x }
                                            })
                                          })
                                        }
                                        all={false}
                                        lab={this.state.user.lab}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Session Duration
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="number"
                                        ref="duration"
                                        value={this.state.user.duration}
                                        onChange={this.durationChange}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>{" "}
                            </React.Fragment>
                          ) : null}
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Password</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="password"
                                    ref="password"
                                    value={this.state.password}
                                    onChange={this.passwordChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Role</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control ">
                                  <StudentRoles
                                    role={this.state.user.role}
                                    changeRole={x =>
                                      this.setState({
                                        user: update(this.state.user, {
                                          role: { $set: x }
                                        })
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      ) : null}
                      <div className="field">
                        <div className="control">
                          <button className="button is-block is-info is-large is-fullwidth">
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default User;
