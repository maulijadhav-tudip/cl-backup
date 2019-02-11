import React, { Component } from "react";
import ReactTable from "react-table";
import base64 from "base-64";
import Markdown from "react-markdown";
import matchSorter from "match-sorter";

class Student extends Component {
  constructor() {
    super();
    this.getUser = this.getUser.bind(this);
    this.getRequests = this.getRequests.bind(this);
    this.createApp = this.createApp.bind(this);
    this.publishApp = this.publishApp.bind(this);
    this.timer = this.timer.bind(this);

    this.state = {
      user: {},
      userLoaded: false,
      notification: false,
      notificationText: "",
      notificationType: "",
      timeRemaining: "",
      intervalId: null,
      data: [],
      columns: [
        {
          Header: "Number Of Tokens",
          accessor: "numberOfTokens",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ["numberOfTokens"] }),
          filterAll: false
        },
        {
          Header: "Tag",
          accessor: "tag",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ["tag"] }),
          filterAll: false
        },
        {
          Header: "Expiration",
          accessor: "expiration",
          filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ["expiration"] }),
          filterAll: false
        },
        {
          Header: "Download",
          accessor: "tag",
          maxWidth: 350,
          Cell: row => (
            <button
              className="button is-primary"
              onClick={() => {
                this.exportTokens(row);
              }}
            >
              Export Tokens
            </button>
          )
        }
      ]
    };
  }
  componentDidMount() {
    this.getUser();
    this.getRequests();
  }
  componentWillUnmount() {
    clearInterval(this.state.intervalId);
  }
  getUser() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/user", {
      method: "GET",
      headers: headers
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.setState({ user: data, userLoaded: true });
                if (data["createdToken"]) {
                  this.timer();
                  var intervalId = setInterval(this.timer, 60000);
                  this.setState({ intervalId: intervalId });
                }
              }.bind(this)
            );
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  exportTokens(row) {
    let formData = new FormData();
    formData.append("tag", row.row.tag);
    formData.append("number", row.row.numberOfTokens);
    formData.append("expiration", row.row.expiration);
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/exporttokens", {
      method: "POST",
      headers: headers,
      body: formData
    })
      .then(response => {
        return response.text();
      })
      .then(text => {
        var downloadLink = document.createElement("a");
        var blob = new Blob([text], { type: "text/csv" });
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = "token_list.csv";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
  }
  getRequests() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/tokendetails", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        this.setState({ data: json });
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  createApp() {
    this.setState({
      notification: true,
      notificationText: "Creating App....",
      notificationType: "notification is-info"
    });
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/app", {
      method: "GET",
      headers: headers
    })
      .then(
        function(response) {
          if (response.status === 200) {
            this.setState({
              notification: true,
              notificationText: "Environment Created!",
              notificationType: "notification is-success"
            });
            this.getUser();
          } else {
            this.setState({
              notification: true,
              notificationText: "Environment Creation Failed!",
              notificationType: "notification is-danger"
            });
            this.getUser();
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  timer() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/remaining", {
      method: "GET",
      headers: headers
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                if (data < 0) data = 0;
                this.setState({ timeRemaining: data });
              }.bind(this)
            );
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  publishApp() {
    this.setState({
      notification: true,
      notificationText: "Publishing App....",
      notificationType: "notification is-info"
    });
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/token", {
      method: "GET",
      headers: headers
    })
      .then(
        function(response) {
          if (response.status === 200) {
            this.setState({
              notification: true,
              notificationText: "Environment Created!",
              notificationType: "notification is-success"
            });
            this.getUser();
          } else {
            this.setState({
              notification: true,
              notificationText: "Environment Creation Failed!",
              notificationType: "notification is-danger"
            });
            this.getUser();
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
    const data = this.state.data;
    const columns = this.state.columns;

    if (
      this.state.user &&
      this.state.user.lab &&
      this.state.user.lab.type === "qwiklab"
    ) {
      return (
        <div className="box has-text-centered">
          <ReactTable
            keyField="requestId"
            ref={r => (this.checkboxTable = r)}
            className="-striped -highlight"
            data={data}
            columns={columns}
          />
        </div>
      );
    }
    return (
      <section className="hero">
        <div className="hero-body">
          <div className="container">
            {this.state.notification ? (
              <div className="box">
                <div className={type}>{message}</div>
              </div>
            ) : null}
            <div className="columns">
              {this.state.userLoaded ? (
                <React.Fragment>
                  {this.state.user.lab.type !== "custom" ? (
                    <div className="column">
                      <React.Fragment>
                        {this.state.user.lab.type === "ravello" ? (
                          <div className="box has-text-centered">
                            {!this.state.user["createdApp"] ? (
                              <button
                                onClick={this.createApp}
                                className="button"
                              >
                                Create Lab
                              </button>
                            ) : null}
                            {this.state.user["createdApp"] &&
                            !this.state.user["createdToken"] ? (
                              <button
                                onClick={this.publishApp}
                                className="button"
                              >
                                Publish Lab
                              </button>
                            ) : null}
                            {this.state.user["createdApp"] &&
                            this.state.user["createdToken"] ? (
                              <div>
                                <a
                                  href={
                                    "https://access.ravellosystems.com/simple/#/" +
                                    this.state.user["token"] +
                                    "/apps/" +
                                    this.state.user["env"]
                                  }
                                  target="_blank"
                                  className="button"
                                  rel="noopener noreferrer"
                                >
                                  Access Lab
                                </a>
                                <p>
                                  Time Remaining: {this.state.timeRemaining}{" "}
                                  minutes
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {this.state.user.lab.type === "azure" ? (
                          <div className="box has-text-centered">
                            {!this.state.user["createdApp"] ? (
                              <button
                                onClick={this.createApp}
                                className="button"
                              >
                                Create User
                              </button>
                            ) : null}
                            {this.state.user["createdApp"] &&
                            !this.state.user["createdToken"] ? (
                              <button
                                onClick={this.publishApp}
                                className="button"
                              >
                                Publish Application
                              </button>
                            ) : null}
                            {this.state.user["createdApp"] &&
                            this.state.user["createdToken"] ? (
                              <div>
                                <h1>
                                  Azure Username:
                                  <strong>
                                    {" " + this.state.user["azure_email"]}
                                  </strong>
                                </h1>
                                <h1>
                                  Azure Password:
                                  <strong>
                                    {" " + this.state.user["azure_password"]}
                                  </strong>
                                </h1>
                                <h1>
                                  Azure Resource Group:
                                  <strong>
                                    {" " + this.state.user["azure_name"]}
                                  </strong>
                                </h1>
                                <p>
                                  Time Remaining: {this.state.timeRemaining}{" "}
                                  minutes
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </React.Fragment>
                    </div>
                  ) : null}
                </React.Fragment>
              ) : null}
              <div className="column">
                {this.state.userLoaded &&
                this.state.user.lab.type !== "qwiklab" ? (
                  <div className="content">
                    <div className="box">
                      <Markdown source={this.state.user.lab.markdown} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default Student;
