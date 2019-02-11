import React, { Component } from "react";
import base64 from "base-64";
import { Redirect } from "react-router-dom";

import LabPicker from "../Utils/LabPicker";
import Scheduler from "./components/Scheduler";
import moment from "moment";

class HotEnvironment extends Component {
  constructor(props) {
    super(props);
    this.saveEdit = this.saveEdit.bind(this);
    this.envsChange = this.envsChange.bind(this);
    this.durationChange = this.durationChange.bind(this);
    this.bufferChange = this.bufferChange.bind(this);
    this.blockChange = this.blockChange.bind(this);
    this.delayChange = this.delayChange.bind(this);

    this.state = {
      lab: {},
      hotenvs: 0,
      block: 0,
      delay: 0,
      tz: "",
      buffer: 0,
      startTime: {},
      duration: 0,
      notification: false,
      notificationText: "",
      notificationType: "",
      redirect: false
    };
  }

  saveEdit(e) {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    e.preventDefault();
    let formData = new FormData();
    formData.append("hotenvs", this.state.hotenvs);
    formData.append("block", this.state.block);
    formData.append("buffer", this.state.buffer);
    formData.append("delay", this.state.delay);
    formData.append("lab", JSON.stringify(this.state.lab));
    formData.append("startTime", this.state.startTime.toISOString());
    formData.append(
      "endTime",
      this.state.startTime.add(this.state.duration, "m").toISOString()
    );
    formData.append("tz", this.state.tz);

    fetch("/api/groups", {
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

  envsChange(event) {
    this.setState({
      hotenvs: event.target.value
    });
  }

  durationChange(event) {
    this.setState({
      duration: event.target.value
    });
  }

  bufferChange(event) {
    this.setState({
      buffer: event.target.value
    });
  }

  delayChange(event) {
    this.setState({
      delay: event.target.value
    });
  }

  blockChange(event) {
    this.setState({
      block: event.target.value
    });
  }

  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    if (this.state.redirect === true) {
      return <Redirect to="/hot" />;
    }
    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <div>
                <h2 className="title">Hot start group</h2>
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
                          <label className="label">Hot Environments</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                type="number"
                                ref="hotenvs"
                                value={this.state.hotenvs}
                                onChange={this.envsChange}
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
                                    lab: x
                                  })
                                }
                                all={false}
                                lab={this.state.lab}
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
                                changeDate={(x, y) => {
                                  this.setState({ startTime: x, tz: y });
                                }}
                                timezone={moment.tz.guess()}
                                time={moment()}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">
                            Keep Running for (minutes)
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
                                onChange={this.durationChange}
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
                                value={this.state.buffer}
                                onChange={this.bufferChange}
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
                                value={this.state.delay}
                                onChange={this.delayChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Size of Blocks</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                type="number"
                                ref="block"
                                value={this.state.block}
                                onChange={this.blockChange}
                              />
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
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default HotEnvironment;
