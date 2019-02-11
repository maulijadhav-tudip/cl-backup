import React, { Component } from "react";
import base64 from "base-64";
import update from "immutability-helper";

import CloudshareProjects from "./components/CloudshareProjects";
import CloudsharePolicies from "./components/CloudsharePolicies";
import RavelloBuckets from "./components/RavelloBuckets";
import Mode from "./components/Mode";

import packageJson from "../../package.json";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.saveEdit = this.saveEdit.bind(this);

    this.getSettings = this.getSettings.bind(this);
    this.changeTitle = this.changeTitle.bind(this);
    this.changeLogo = this.changeLogo.bind(this);
    this.changeWelcome = this.changeWelcome.bind(this);
    this.changeCheck = this.changeCheck.bind(this);
    this.changeSeat = this.changeSeat.bind(this);

    this.state = {
      notification: false,
      notificationText: "",
      notificationType: "",
      settings: {},
      loadedSettings: false,
      polcicyReRender: false
    };
  }
  changeCheck(event) {
    this.setState({
      settings: update(this.state.settings, {
        userquestions: { $set: !this.state.settings.userquestions }
      })
    });
  }
  changeSeat(event) {
    this.setState({
      settings: update(this.state.settings, {
        seat: { $set: !this.state.settings.seat }
      })
    });
  }
  changeTitle(event) {
    this.setState({
      settings: update(this.state.settings, {
        title: { $set: event.target.value }
      })
    });
  }
  changeWelcome(event) {
    this.setState({
      settings: update(this.state.settings, {
        welcome: { $set: event.target.value }
      })
    });
  }
  changeLogo(event) {
    this.setState({
      settings: update(this.state.settings, {
        logo: { $set: event.target.value }
      })
    });
  }
  getSettings() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/settings", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        this.setState({
          settings: json,
          loadedSettings: true
        });
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  componentDidMount() {
    this.getSettings();
  }
  saveEdit(e) {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    e.preventDefault();
    let formData = new FormData();

    formData.append("title", this.refs.title.value);
    formData.append("welcome", this.refs.welcome.value);
    formData.append("logo", this.refs.logo.value);
    formData.append("userquestions", this.refs.userquestions.checked);
    formData.append("seat", this.refs.seat.checked);

    fetch("/api/settings", {
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

  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;

    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <div>
                <h2 className="title">Settings</h2>
                <h3>V{packageJson.version}</h3>
                {this.state.notification ? (
                  <div className={type}>{message}</div>
                ) : null}
                <div className="column is-6 is-offset-3">
                  {this.state.loadedSettings ? (
                    <React.Fragment>
                      <div className="box">
                        <form
                          onSubmit={this.saveEdit}
                          method="post"
                          className="control"
                        >
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Title</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="title"
                                    onChange={this.changeTitle}
                                    value={this.state.settings.title}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Welcome</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="welcome"
                                    onChange={this.changeWelcome}
                                    value={this.state.settings.welcome}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Logo</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="logo"
                                    onChange={this.changeLogo}
                                    value={this.state.settings.logo}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">
                                Cloudshare Project
                              </label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <CloudshareProjects
                                    changeProject={x => {
                                      let headers = new Headers();
                                      headers.append(
                                        "Authorization",
                                        "Basic " +
                                          base64.encode(
                                            window.localStorage.getItem(
                                              "authToken"
                                            ) + ":x"
                                          )
                                      );

                                      let formData = new FormData();
                                      formData.append(
                                        "project",
                                        JSON.stringify(x)
                                      );

                                      fetch("/api/cloudshare/projects", {
                                        method: "POST",
                                        body: formData,
                                        headers: headers
                                      }).then(y => {
                                        this.setState({
                                          settings: update(
                                            this.state.settings,
                                            {
                                              cloudshareProject: { $set: x }
                                            }
                                          )
                                        });
                                      });
                                    }}
                                    projectId={
                                      this.state.settings.cloudshareProject.id
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Cloudshare Policy</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <CloudsharePolicies
                                    changePolicy={x => {
                                      let headers = new Headers();
                                      headers.append(
                                        "Authorization",
                                        "Basic " +
                                          base64.encode(
                                            window.localStorage.getItem(
                                              "authToken"
                                            ) + ":x"
                                          )
                                      );

                                      let formData = new FormData();
                                      formData.append(
                                        "policy",
                                        JSON.stringify(x)
                                      );

                                      fetch("/api/cloudshare/policies", {
                                        method: "POST",
                                        body: formData,
                                        headers: headers
                                      });
                                    }}
                                    policyId={
                                      this.state.settings.cloudsharePolicy.id
                                    }
                                    projectId={
                                      this.state.settings.cloudshareProject.id
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Ravello Bucket</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <RavelloBuckets
                                    changeBucket={x => {
                                      let headers = new Headers();
                                      headers.append(
                                        "Authorization",
                                        "Basic " +
                                          base64.encode(
                                            window.localStorage.getItem(
                                              "authToken"
                                            ) + ":x"
                                          )
                                      );

                                      let formData = new FormData();
                                      formData.append(
                                        "bucket",
                                        JSON.stringify(x)
                                      );

                                      fetch("/api/buckets", {
                                        method: "POST",
                                        body: formData,
                                        headers: headers
                                      });
                                    }}
                                    bucketId={this.state.settings.bucket.id}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Portal Mode</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <Mode
                                    changeMode={x => {
                                      let headers = new Headers();
                                      headers.append(
                                        "Authorization",
                                        "Basic " +
                                          base64.encode(
                                            window.localStorage.getItem(
                                              "authToken"
                                            ) + ":x"
                                          )
                                      );

                                      let formData = new FormData();
                                      formData.append("mode", x);

                                      fetch("/api/mode", {
                                        method: "POST",
                                        body: formData,
                                        headers: headers
                                      });
                                    }}
                                    mode={this.state.settings.mode}
                                  />
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
                                      ref="userquestions"
                                      name="userquestions"
                                      checked={
                                        !!this.state.settings.userquestions
                                      }
                                      onChange={this.changeCheck}
                                    />
                                    Questions on Register
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
                                      ref="seat"
                                      name="seat"
                                      checked={!!this.state.settings.seat}
                                      onChange={this.changeSeat}
                                    />
                                    Seat Number Input
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="field">
                            <div className="control">
                              <button className="button is-block is-info is-large is-fullwidth">
                                Save
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </React.Fragment>
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

export default Settings;
