import React, { Component } from "react";
import base64 from "base-64";
import "whatwg-fetch";
import ReactTable from "react-table";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css
import Downloader from "./components/Downloader";

import moment from "moment-timezone";

class Classes extends Component {
  constructor(props) {
    super(props);
    this.getClasses = this.getClasses.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      tableOptions: {
        loading: true,
        showPagination: true,
        showPageSizeOptions: true,
        showPageJump: true,
        collapseOnSortingChange: true,
        collapseOnPageChange: true,
        collapseOnDataChange: true,
        freezeWhenExpanded: false,
        filterable: true,
        sortable: true,
        resizable: true
      },
      data: [],
      localTimezone: false
    };
  }
  getClasses() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/classes", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let pageSizeOptions = [5, 10, 20, 25, 50, 100, json.length];
        this.setState({
          tableOptions: {
            loading: false,
            showPagination: true,
            showPageSizeOptions: true,
            showPageJump: true,
            collapseOnSortingChange: true,
            collapseOnPageChange: true,
            collapseOnDataChange: true,
            freezeWhenExpanded: false,
            filterable: true,
            sortable: true,
            resizable: true,
            pageSizeOptions: pageSizeOptions.sort(function(a, b) {
              return a - b;
            })
          },
          data: json
        });
      })
      .catch(function(ex) {
        console.log(ex);
      });
  }
  componentDidMount() {
    this.getClasses();
    this.interval = setInterval(() => this.getClasses(), 60000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handleChange(checked) {
    this.setState({ localTimezone: !this.state.localTimezone });
  }

  render() {
    const data = this.state.data;
    const columns = [
      {
        Header: "Status",
        accessor: "time",
        filterable: false,
        maxWidth: 110,
        Cell: row => (
          <span>
            <span
              style={{
                color:
                  moment.utc(row.value.end.$date) > moment().utc() &&
                  moment.utc(row.value.deploy.$date) < moment().utc()
                    ? "#ADFF2F"
                    : moment.utc(row.value.end.$date) > moment().utc() &&
                      moment.utc(row.value.start.$date) < moment().utc()
                    ? "#57d500"
                    : "#ff2e00",
                transition: "all .3s ease"
              }}
            >
              &#x25cf;
            </span>
            {moment.utc(row.value.start.$date) > moment().utc() &&
            moment.utc(row.value.deploy.$date) > moment().utc()
              ? "Scheduled"
              : moment.utc(row.value.start.$date) > moment().utc() &&
                moment.utc(row.value.deploy.$date) < moment().utc()
              ? "Deploying"
              : moment.utc(row.value.end.$date) > moment().utc() &&
                moment.utc(row.value.start.$date) < moment().utc()
              ? "Active"
              : "Expired"}
          </span>
        )
      },

      {
        Header: "Class ID",
        accessor: "id",
        maxWidth: 100,
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["id"] }),
        filterAll: true
      },
      {
        Header: "Name",
        accessor: "name",
        maxWidth: 200,
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["name"] }),
        filterAll: true
      },
      {
        Header: "Lab",
        maxWidth: 200,
        accessor: "lab.name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["lab"] }),
        filterAll: true
      },
      {
        Header: "Type of Class",
        accessor: "type",
        maxWidth: 100,
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["type"] }),
        filterAll: true
      },
      {
        Header: "Start Time",
        accessor: "startTz",
        maxWidth: 350,
        filterMethod: (filter, rows) =>
          matchSorter(
            rows.map(x => {
              x["startFilter"] = moment
                .tz(
                  moment(x.time.start.$date).utc(),
                  this.state.localTimezone ? moment.tz.guess() : x.time.tz
                )
                .format("MMMM Do YYYY, h:mm:ss a z");
              return x;
            }),
            filter.value,
            { keys: ["startFilter"] }
          ),
        filterAll: true,
        Cell: row => (
          <p>
            {moment(row.value.start.$date).isValid()
              ? moment
                  .tz(
                    moment(row.value.start.$date).utc(),
                    this.state.localTimezone ? moment.tz.guess() : row.value.tz
                  )
                  .format("MMMM Do YYYY, h:mm:ss a z")
              : null}
          </p>
        )
      },
      {
        Header: "End Time",
        accessor: "endTz",
        maxWidth: 350,
        filterMethod: (filter, rows) =>
          matchSorter(
            rows.map(x => {
              x["endFilter"] = moment
                .tz(
                  moment(x.time.end.$date).utc(),
                  this.state.localTimezone ? moment.tz.guess() : x.time.tz
                )
                .format("MMMM Do YYYY, h:mm:ss a z");
              return x;
            }),
            filter.value,
            { keys: ["endFilter"] }
          ),
        filterAll: true,
        Cell: row => (
          <p>
            {moment(row.value.end.$date).isValid()
              ? moment
                  .tz(
                    moment(row.value.end.$date).utc(),
                    this.state.localTimezone ? moment.tz.guess() : row.value.tz
                  )
                  .format("MMMM Do YYYY, h:mm:ss a z")
              : null}
          </p>
        )
      },
      {
        Header: "Region",
        maxWidth: 100,
        accessor: "lab.region",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["region"] }),
        Cell: row => (
          <p>{row.value.display_name ? row.value.display_name : row.value}</p>
        ),
        filterAll: true
      },
      {
        Header: "SFDC",
        accessor: "sfdc",
        maxWidth: 100,
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["sfdc"] }),
        filterAll: true
      },
      {
        Header: "Edit",
        accessor: "id",
        maxWidth: 100,
        Cell: row => (
          <Link
            to={`/class/${row.value}`}
            className="button is-info is-fullwidth"
          >
            Edit
          </Link>
        ),
        filterable: false
      },
      {
        Header: "Delete",
        maxWidth: 100,
        accessor: "id",
        Cell: row => (
          <a
            onClick={() => {
              confirmAlert({
                customUI: ({ onClose }) => {
                  return (
                    <div className="custom-ui">
                      <h1>Are you sure you want to delete this class?</h1>

                      <div className="field is-grouped">
                        <p className="control">
                          <button
                            className="button is-primary"
                            onClick={onClose}
                          >
                            No
                          </button>
                        </p>
                        <p className="control">
                          <button
                            className="button is-danger"
                            onClick={() => {
                              let headers = new Headers();
                              headers.append(
                                "Authorization",
                                "Basic " +
                                  base64.encode(
                                    window.localStorage.getItem("authToken") +
                                      ":x"
                                  )
                              );
                              fetch(`/api/classes/${row.value}/delete`, {
                                method: "POST",
                                headers: headers
                              }).then(
                                function(response) {
                                  this.getClasses();
                                }.bind(this)
                              );
                              onClose();
                            }}
                          >
                            Delete
                          </button>
                        </p>
                      </div>
                    </div>
                  );
                }
              });
            }}
            className="button is-danger is-fullwidth"
          >
            Delete
          </a>
        ),
        filterable: false
      }
    ];
    return (
      <div>
        {this.state.logVisible ? (
          <div id="modal" className="modal is-active">
            <div className="modal-background" />
            <div className="modal-content">
              <div className="box">
                <Downloader type="class" />
              </div>
            </div>
            <button
              className="modal-close is-large"
              aria-label="close"
              onClick={() => {
                this.setState({ logVisible: false });
              }}
            />
          </div>
        ) : null}
        <section className="section">
          <div className="container is-fluid">
            <div className="columns">
              <div className="column">
                <div className="field is-grouped">
                  <p className="control">
                    <LinkContainer
                      to={{
                        pathname: "/class",
                        state: { type: "normal" }
                      }}
                    >
                      <a className="button is-info">New Class</a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer
                      to={{
                        pathname: "/class",
                        state: { type: "hot" }
                      }}
                    >
                      <a className="button is-info">
                        New Class with Hot Environments
                      </a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer
                      to={{
                        pathname: "/class",
                        state: { type: "pregen" }
                      }}
                    >
                      <a className="button is-info">
                        New Class with Pre-Generated User Accounts
                      </a>
                    </LinkContainer>
                  </p>
                  {this.props.role === "admin" ? (
                    <p className="control">
                      <a
                        className="button is-info"
                        onClick={() => {
                          this.setState({ logVisible: true });
                        }}
                      >
                        Download Logs
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="column" />

              <div className="column" />
              <div className="column">
                <div className="field">
                  <input
                    id="switchColorDefault"
                    type="checkbox"
                    name="switchColorDefault"
                    className="switch is-rtl"
                    onClick={this.handleChange}
                    checked={this.state.localTimezone}
                  />
                  <label htmlFor="switchColorDefault">My PC Timezone</label>
                </div>
              </div>
            </div>

            <div className="box">
              <ReactTable
                className="-striped -highlight"
                data={data}
                columns={columns}
                defaultFilterMethod={(filter, row) =>
                  String(row[filter.id]) === filter.value
                }
                SubComponent={row => {
                  if (row.original.type === "hot") {
                    return (
                      <div style={{ padding: "20px" }}>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Scheduled Hot Environments</th>
                              <th>Deployed Hot Environments</th>
                              <th>Deployment Buffer (minutes)</th>
                              <th>Deployment Block Size</th>
                              <th>Deployment Block Delay</th>
                              <th>Deletion Buffer</th>
                              <th>Last Published</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{row.original.hotenvs}</td>
                              <td>{row.original.envs.length}</td>
                              <td>{row.original.buffer}</td>
                              <td>{row.original.blockSize}</td>
                              <td>{row.original.blockDelay}</td>
                              <td>{row.original.endBuffer}</td>
                              <td>
                                {moment(
                                  row.original.lastPublished.$date
                                ).isValid()
                                  ? moment
                                      .tz(
                                        moment(
                                          row.original.lastPublished.$date
                                        ).utc(),
                                        this.state.localTimezone
                                          ? moment.tz.guess()
                                          : row.original.tz
                                      )
                                      .format("MMMM Do YYYY, h:mm:ss a z")
                                  : null}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  } else if (row.original.type === "pregen") {
                    return (
                      <div style={{ padding: "20px" }}>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Scheduled Environments</th>
                              <th>Deployed Environments</th>
                              <th>Deployment Buffer (minutes)</th>
                              <th>Deployment Block Size</th>
                              <th>Deployment Block Delay</th>
                              <th>Deletion Buffer</th>
                              <th>Last Published</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{row.original.envs}</td>
                              <td>{row.original.createdEnvs}</td>
                              <td>{row.original.buffer}</td>
                              <td>{row.original.blockSize}</td>
                              <td>{row.original.blockDelay}</td>
                              <td>{row.original.endBuffer}</td>
                              <td>
                                {moment(
                                  row.original.lastPublished.$date
                                ).isValid()
                                  ? moment
                                      .tz(
                                        moment(
                                          row.original.lastPublished.$date
                                        ).utc(),
                                        this.state.localTimezone
                                          ? moment.tz.guess()
                                          : row.original.tz
                                      )
                                      .format("MMMM Do YYYY, h:mm:ss a z")
                                  : null}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  } else {
                    <div style={{ padding: "20px" }}>No Hot Environments.</div>;
                  }
                }}
                {...this.state.tableOptions}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Classes;
