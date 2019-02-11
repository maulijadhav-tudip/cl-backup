import React, { Component } from "react";
import base64 from "base-64";
import { Redirect } from "react-router-dom";
import update from "immutability-helper";
import Markdown from "react-markdown";
import RavelloBlueprints from "./components/RavelloBlueprints";
import RavelloOptimization from "./components/RavelloOptimization";
import RavelloRegions from "./components/RavelloRegions";
import AzureRegions from "./components/AzureRegions";
import CloudshareBlueprints from "./components/CloudshareBlueprints";
import CloudshareRegions from "./components/CloudshareRegions";
import QwiklabType from "./components/QwiklabType";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

class Lab extends Component {
  constructor(props) {
    super(props);
    this.saveEdit = this.saveEdit.bind(this);
    this.nameChange = this.nameChange.bind(this);
    this.descriptionChange = this.descriptionChange.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
    this.markdownChange = this.markdownChange.bind(this);
    this.templateChange = this.templateChange.bind(this);
    this.tagChange = this.tagChange.bind(this);

    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleTemplateChange = this._handleTemplateChange.bind(this);

    this.state = {
      labId: this.props.match.params.id,
      lab: {
        name: "",
        description: "",
        blueprint: { id: 0 },
        optimizationLevel: "",
        region: "",
        enabled: "true",
        markdown: "",
        template: "",
        tag: ""
      },
      notification: false,
      notificationText: "",
      notificationType: "",
      redirect: false,
      labLoaded: false,
      preview: false
    };
  }
  getLab() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/labs/" + this.state.labId, {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        this.setState({
          lab: json,
          labLoaded: true
        });
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  componentDidMount() {
    if (this.props.new) {
      if (this.props.type === "ravello") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "ravello" }
          }),
          labLoaded: true
        });
      } else if (this.props.type === "cloudshare") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "cloudshare" }
          }),
          labLoaded: true
        });
      } else if (this.props.type === "qwiklab") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "qwiklab" }
          }),
          labLoaded: true
        });
      } else if (this.props.type === "qwiklab_one") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "qwiklab_one" }
          }),
          labLoaded: true
        });
      } else if (this.props.type === "custom") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "custom" }
          }),
          labLoaded: true
        });
      } else if (this.props.type === "azure") {
        this.setState({
          lab: update(this.state.lab, {
            type: { $set: "azure" }
          }),
          labLoaded: true
        });
      }
    } else {
      this.getLab();
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
    let blueprint = this.state.lab.blueprint;
    formData.append("name", this.refs.name.value);
    formData.append("description", this.refs.description.value);
    formData.append("optimizationLevel", this.state.lab.optimizationLevel);
    if (this.state.lab.optimizationLevel === "COST_OPTIMIZED")
      formData.append("region", "");
    else formData.append("region", JSON.stringify(this.state.lab.region));

    formData.append("blueprint", JSON.stringify(blueprint));
    formData.append("enabled", this.state.lab.enabled);

    formData.append("markdown", this.state.lab.markdown);
    formData.append("template", this.state.lab.template);
    formData.append("type", this.state.lab.type);

    let url = "";
    if (this.state.lab._id) url = "/" + this.state.lab._id.$oid;

    let type = this.state.lab.type;

    if (type === "qwiklab_one") {
      type = "qwiklab";
      formData.append("tag", this.state.lab.tag);
      formData.append("expiration", this.state.lab.expiration);
    }
    fetch("/api/" + type + "/labs" + url, {
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
  descriptionChange(event) {
    this.setState({
      lab: update(this.state.lab, {
        description: { $set: event.target.value }
      })
    });
  }
  tagChange(event) {
    this.setState({
      lab: update(this.state.lab, {
        tag: { $set: event.target.value }
      })
    });
  }
  nameChange(event) {
    this.setState({
      lab: update(this.state.lab, {
        name: { $set: event.target.value }
      })
    });
  }
  markdownChange(event) {
    this.setState({
      lab: update(this.state.lab, {
        markdown: { $set: event.target.value }
      })
    });
  }
  templateChange(event) {
    this.setState({
      lab: update(this.state.lab, {
        template: { $set: event.target.value }
      })
    });
  }
  handleCheck(event) {
    let newVal = "";
    if (this.state.lab.enabled === "true") newVal = "false";
    else newVal = "true";
    this.setState({
      lab: update(this.state.lab, {
        enabled: { $set: newVal }
      })
    });
  }
  _handleFileChange(e) {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      this.setState({
        lab: update(this.state.lab, {
          markdown: { $set: reader.result }
        })
      });
    };

    reader.readAsText(file);
  }

  _handleTemplateChange(e) {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      this.setState({
        lab: update(this.state.lab, {
          template: { $set: reader.result }
        })
      });
    };

    reader.readAsText(file);
  }

  render() {
    const message = this.state.notificationText;
    const type = this.state.notificationType;
    if (this.state.redirect === true) {
      return <Redirect to="/labs" />;
    }
    let $MarkdownPreview = null;
    if (this.state.lab.markdown) {
      $MarkdownPreview = <Markdown source={this.state.lab.markdown} />;
    }

    return (
      <div>
        <section className="hero">
          <div className="hero-body">
            <div className="container has-text-centered">
              <div>
                <h2 className="title">Lab: {this.state.lab.name}</h2>
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
                          <label className="label">Name</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control">
                              <input
                                className="input"
                                type="text"
                                ref="name"
                                value={this.state.lab.name}
                                onChange={this.nameChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="field is-horizontal">
                        <div className="field-label is-normal">
                          <label className="label">Description</label>
                        </div>
                        <div className="field-body">
                          <div className="field">
                            <div className="control ">
                              <input
                                className="input"
                                type="text"
                                ref="description"
                                value={this.state.lab.description}
                                onChange={this.descriptionChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {this.state.labLoaded === true ? (
                        <div>
                          {this.state.lab.type === "qwiklab" ||
                          this.state.lab.type === "qwiklab_one" ? (
                            <div className="field is-horizontal">
                              <div className="field-label is-normal">
                                <label className="label">Type</label>
                              </div>
                              <div className="field-body">
                                <div className="field">
                                  <div className="control ">
                                    <QwiklabType
                                      Type={
                                        this.state.lab.type === "qwiklab_one"
                                          ? "Single token request (for Self-paced lab)"
                                          : "Bulk token request (for FMM)"
                                      }
                                      changeType={x => {
                                        if (
                                          x ===
                                          "Single token request (for Self-paced lab)"
                                        ) {
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              type: { $set: "qwiklab_one" }
                                            })
                                          });
                                        } else
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              type: { $set: "qwiklab" }
                                            })
                                          });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {this.state.lab.type === "qwiklab_one" ? (
                            <React.Fragment>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">Tag</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <input
                                        className="input"
                                        type="text"
                                        ref="tag"
                                        value={this.state.lab.tag}
                                        onChange={this.tagChange}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">Expiration</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <Datetime
                                        closeOnSelect
                                        inputProps={{
                                          readOnly: true,
                                          placeholder: "mm/dd/yyyy"
                                        }}
                                        value={this.state.lab.expiration}
                                        timeFormat={false}
                                        onChange={x =>
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              expiration: {
                                                $set: x.format("MM/DD/YYYY")
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
                          {this.state.lab.type === "ravello" ||
                          this.state.lab.type === "azure" ||
                          this.state.lab.type === "custom" ? (
                            <div>
                              {this.state.lab.markdown ? (
                                <div className="field is-horizontal">
                                  <div className="field-label is-normal">
                                    <label className="label">
                                      Markdown for Student Page
                                    </label>
                                  </div>
                                  <div className="field-body">
                                    <div className="field">
                                      <div className="control ">
                                        <textarea
                                          className="textarea"
                                          type="text"
                                          ref="markdown"
                                          value={this.state.lab.markdown}
                                          onChange={this.markdownChange}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="field is-horizontal">
                                  <div className="field-label is-normal">
                                    <label className="label">
                                      Markdown for Student Page
                                    </label>
                                  </div>
                                  <div className="field-body">
                                    <div className="field">
                                      <div className="control ">
                                        <input
                                          type="file"
                                          onChange={this._handleFileChange}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <section className="accordions">
                                {this.state.preview ? (
                                  <article className="accordion is-active">
                                    <div
                                      className="accordion-header"
                                      onClick={x => {
                                        x.preventDefault();
                                        this.setState({
                                          preview: !this.state.preview
                                        });
                                      }}
                                    >
                                      <p>Preview</p>
                                    </div>
                                    <div className="accordion-body">
                                      <div className="accordion-content">
                                        <div className="content">
                                          {$MarkdownPreview}
                                        </div>
                                      </div>
                                    </div>
                                  </article>
                                ) : (
                                  <article className="accordion">
                                    <div className="accordion-header">
                                      <p>Preview</p>
                                      <button
                                        aria-label="toggle"
                                        className="toggle"
                                        onClick={x => {
                                          x.preventDefault();
                                          this.setState({
                                            preview: !this.state.preview
                                          });
                                        }}
                                      />
                                    </div>
                                  </article>
                                )}
                              </section>
                              <br />
                            </div>
                          ) : null}

                          {this.state.lab.type === "ravello" ? (
                            <div>
                              <div>
                                <div className="field is-horizontal">
                                  <div className="field-label is-normal">
                                    <label className="label">Blueprint</label>
                                  </div>
                                  <div className="field-body">
                                    <div className="field">
                                      <div className="control ">
                                        <RavelloBlueprints
                                          blueprintId={
                                            this.state.lab.blueprint.id
                                          }
                                          changeBlueprint={x =>
                                            this.setState({
                                              lab: update(this.state.lab, {
                                                blueprint: { $set: x }
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
                                      Optimization
                                    </label>
                                  </div>
                                  <div className="field-body">
                                    <div className="field">
                                      <div className="control ">
                                        <RavelloOptimization
                                          optimizationLevel={
                                            this.state.lab.optimizationLevel
                                          }
                                          changeLevel={x =>
                                            this.setState({
                                              lab: update(this.state.lab, {
                                                optimizationLevel: { $set: x }
                                              })
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {this.state.lab.optimizationLevel ===
                                "PERFORMANCE_OPTIMIZED" ? (
                                  <div className="field is-horizontal">
                                    <div className="field-label is-normal">
                                      <label className="label">Region</label>
                                    </div>
                                    <div className="field-body">
                                      <div className="field">
                                        <div className="control ">
                                          <RavelloRegions
                                            blueprintId={
                                              this.state.lab.blueprint.id
                                            }
                                            region={this.state.lab.region}
                                            changeRegion={x =>
                                              this.setState({
                                                lab: update(this.state.lab, {
                                                  region: { $set: x.regionName }
                                                })
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div />
                                )}
                              </div>
                            </div>
                          ) : null}
                          {this.state.lab.type === "azure" ? (
                            <div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">Region</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <AzureRegions
                                        region={this.state.lab.region}
                                        changeRegion={x =>
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              region: { $set: x }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                {this.state.lab.template ? (
                                  <div className="field is-horizontal">
                                    <div className="field-label is-normal">
                                      <label className="label">
                                        JSON Template for Deployment
                                      </label>
                                    </div>
                                    <div className="field-body">
                                      <div className="field">
                                        <div className="control ">
                                          <textarea
                                            className="textarea"
                                            type="text"
                                            ref="markdown"
                                            value={this.state.lab.template}
                                            onChange={this.templateChange}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="field is-horizontal">
                                    <div className="field-label is-normal">
                                      <label className="label">
                                        JSON Template for Deployment{" "}
                                      </label>
                                    </div>
                                    <div className="field-body">
                                      <div className="field">
                                        <div className="control ">
                                          <input
                                            type="file"
                                            onChange={
                                              this._handleTemplateChange
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                          {this.state.lab.type === "cloudshare" ? (
                            <div>
                              <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                  <label className="label">Blueprint</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <CloudshareBlueprints
                                        blueprintId={
                                          this.state.lab.blueprint.id
                                        }
                                        changeBlueprint={x =>
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              blueprint: { $set: x }
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
                                  <label className="label">Region</label>
                                </div>
                                <div className="field-body">
                                  <div className="field">
                                    <div className="control ">
                                      <CloudshareRegions
                                        region={this.state.lab.region}
                                        changeRegion={x =>
                                          this.setState({
                                            lab: update(this.state.lab, {
                                              region: { $set: x }
                                            })
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="field">
                        <div className="control ">
                          <label className="checkbox">
                            <input
                              onChange={this.handleCheck}
                              checked={this.state.lab.enabled === "true"}
                              type="checkbox"
                            />
                            Enabled
                          </label>
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

export default Lab;
