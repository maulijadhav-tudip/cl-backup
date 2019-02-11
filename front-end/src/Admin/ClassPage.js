import React, { Component } from "react";
import base64 from "base-64";
import { Redirect } from "react-router-dom";
import update from "immutability-helper";
import moment from "moment";
import LabPicker from "../Utils/LabPicker";
import Scheduler from "./components/Scheduler";
class ClassPage extends Component {
  constructor(props) {
    super(props);
    this.saveEdit = this.saveEdit.bind(this);
    this.changeDate = this.changeDate.bind(this);
    this.state = {
      type: "",
      class: {
        name: "",
        secret: "",
        startTime: "",
        endTime: "",
        envs: 0,
        baseName: "",
        blockSize: 0,
        blockDelay: 0,
        buffer: 0,
        endBuffer: 15,
        timezone: "",
        id: Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase(),
        lab: {},
        max: 0,
        sfdc: ""
      },
      duration: 120,
      notification: false,
      notificationText: "",
      notificationType: "",
      classLoaded: false,
      redirect: false,
      startTime: moment(),
      timezone: moment.tz.guess()
    };
  }
  getClass() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/classes/" + this.props.match.params.id, {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        this.setState({
          duration: (json.endTime.$date - json.startTime.$date) / 60000,
          class: json,
          classLoaded: true,
          type: json.type,
          startTime: moment.tz(
            moment(json.startTime.$date).utc(),
            json.timezone
          ),
          timezone: json.timezone
        });
        if (json.type === "hot") {
          this.setState({
            class: update(this.state.class, {
              envs: { $set: json.hotenvs }
            })
          });
        }
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  componentDidMount() {
    if (typeof this.props.location.state === "undefined") {
      this.getClass();
    } else {
      this.setState({
        classLoaded: true,
        type: this.props.location.state.type
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
    formData.append("name", this.state.class.name);
    formData.append("id", this.state.class.id);
    formData.append("secret", this.state.class.secret);
    formData.append("sfdc", this.state.class.sfdc);

    formData.append("type", this.state.type);

    formData.append("startTime", this.state.startTime.toISOString());
    formData.append(
      "endTime",
      this.state.startTime.add(this.state.duration, "m").toISOString()
    );
    formData.append("lab", JSON.stringify(this.state.class.lab));
    formData.append("timezone", this.state.timezone);
    formData.append("endBuffer", this.state.class.endBuffer);

    if (this.state.type === "normal" || this.state.type === "hot")
      formData.append("max", this.state.class.max);

    if (this.state.type === "pregen") {
      formData.append("envs", this.state.class.envs);
      formData.append("blockSize", this.state.class.blockSize);
      formData.append("buffer", this.state.class.buffer);
      formData.append("blockDelay", this.state.class.blockDelay);
      formData.append("studentPass", this.state.class.secret);
      formData.append("baseName", this.state.class.baseName);
    }

    if (this.state.type === "hot") {
      formData.append("hotenvs", this.state.class.envs);
      formData.append("blockSize", this.state.class.blockSize);
      formData.append("buffer", this.state.class.buffer);
      formData.append("blockDelay", this.state.class.blockDelay);
    }
    let url = "";
    if (typeof this.props.match.params.id !== "undefined") {
      url = "/" + this.props.match.params.id;
    }
    fetch("/api/classes" + url, {
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
  changeDate(x, y) {
    this.setState({
      timezone: y,
      startTime: x
    });
  }
  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    if (this.state.redirect === true) {
      return <Redirect to="/classes" />;
    }
    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <div>
                <h2 className="title">Class</h2>
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
                      {this.state.classLoaded === true ? (
                        <React.Fragment>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Class Name</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="className"
                                    value={this.state.class.name}
                                    onChange={x =>
                                      this.setState({
                                        class: update(this.state.class, {
                                          name: { $set: x.target.value }
                                        })
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Class ID</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="id"
                                    value={this.state.class.id}
                                    disabled={true}
                                  />
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
                                    value={this.state.class.secret}
                                    onChange={x =>
                                      this.setState({
                                        class: update(this.state.class, {
                                          secret: { $set: x.target.value }
                                        })
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">SFDC Campaign ID</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="text"
                                    ref="sfdc"
                                    value={this.state.class.sfdc}
                                    onChange={x =>
                                      this.setState({
                                        class: update(this.state.class, {
                                          sfdc: { $set: x.target.value }
                                        })
                                      })
                                    }
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
                                    changeLab={x =>
                                      this.setState({
                                        class: update(this.state.class, {
                                          lab: { $set: x }
                                        })
                                      })
                                    }
                                    all={false}
                                    lab={this.state.class.lab}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">Start Time</label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control ">
                                  <Scheduler
                                    changeDate={this.changeDate}
                                    timezone={this.state.timezone}
                                    time={this.state.startTime}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">
                                Duration (minutes)
                              </label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="number"
                                    ref="duration"
                                    value={this.state.duration}
                                    onChange={x =>
                                      this.setState({
                                        duration: x.target.value
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          {this.state.type === "normal" ||
                          this.state.type === "hot" ? (
                            <div className="field is-horizontal">
                              <div className="field-label is-normal">
                                <label className="label">Max Students</label>
                              </div>
                              <div className="field-body">
                                <div className="field">
                                  <div className="control">
                                    <input
                                      className="input"
                                      type="number"
                                      ref="max"
                                      value={this.state.class.max}
                                      onChange={x =>
                                        this.setState({
                                          class: update(this.state.class, {
                                            max: { $set: x.target.value }
                                          })
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {this.state.type === "pregen" ? (
                            <React.Fragment>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Student Base Name
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="text"
                                        ref="baseName"
                                        value={this.state.class.baseName}
                                        onChange={x =>
                                          this.setState({
                                            class: update(this.state.class, {
                                              baseName: { $set: x.target.value }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Student Password
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="text"
                                        ref="studentPass"
                                        value={this.state.class.secret}
                                        disabled={true}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          ) : null}

                          {this.state.type === "hot" ||
                          this.state.type === "pregen" ? (
                            <React.Fragment>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Number of Environments to Generate
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="number"
                                        ref="envs"
                                        value={this.state.class.envs}
                                        onChange={x =>
                                          this.setState({
                                            class: update(this.state.class, {
                                              envs: { $set: x.target.value }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Publish Before Start (minutes)
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="number"
                                        ref="buffer"
                                        value={this.state.class.buffer}
                                        onChange={x =>
                                          this.setState({
                                            class: update(this.state.class, {
                                              buffer: { $set: x.target.value }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Delay between Blocks (minutes)
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="number"
                                        ref="delay"
                                        value={this.state.class.blockDelay}
                                        onChange={x =>
                                          this.setState({
                                            class: update(this.state.class, {
                                              blockDelay: {
                                                $set: x.target.value
                                              }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">
                                    Size of Blocks
                                  </label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control">
                                      <input
                                        className="input"
                                        type="number"
                                        ref="block"
                                        value={this.state.class.blockSize}
                                        onChange={x =>
                                          this.setState({
                                            class: update(this.state.class, {
                                              blockSize: {
                                                $set: x.target.value
                                              }
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

                          <div className="field is-horizontal">
                            <div className="field-label is-normal">
                              <label className="label">
                                Deletion Buffer (minutes)
                              </label>
                            </div>
                            <div className="field-body">
                              <div className="field">
                                <div className="control">
                                  <input
                                    className="input"
                                    type="number"
                                    ref="endBuffer"
                                    value={this.state.class.endBuffer}
                                    onChange={x =>
                                      this.setState({
                                        class: update(this.state.class, {
                                          endBuffer: {
                                            $set: x.target.value
                                          }
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

export default ClassPage;
