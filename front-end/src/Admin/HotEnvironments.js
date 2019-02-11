import React, { Component } from "react";
import base64 from "base-64";
import "whatwg-fetch";
import ReactTable from "react-table";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import { LinkContainer } from "react-router-bootstrap";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import moment from "moment-timezone";

class HotEnvironments extends Component {
  constructor(props) {
    super(props);
    this.getGroups = this.getGroups.bind(this);
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
  getGroups() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/groups", {
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
    this.getGroups();
    this.interval = setInterval(() => this.getGroups(), 60000);
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
        Header: "Lab",
        accessor: "lab.name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["lab"] }),
        filterAll: true
      },
      {
        Header: "Available Hot",
        accessor: "envs",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["hotenvs"] }),
        Cell: row => <p>{row.value.length}</p>,
        filterAll: true
      },
      {
        Header: "Environments Accessed",
        accessor: "usedEnvs",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["usedEnvs"] }),
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
        Header: "Delete",
        accessor: "_id.$oid",
        maxWidth: 150,
        Cell: row => (
          <a
            onClick={() => {
              confirmAlert({
                customUI: ({ onClose }) => {
                  return (
                    <div className="custom-ui">
                      <h1>Are you sure you want to delete this group?</h1>

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
                              fetch(`/api/groups/${row.value}/delete`, {
                                method: "POST",
                                headers: headers
                              }).then(
                                function(response) {
                                  this.getGroups();
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
        <section className="section">
          <div className="container is-fluid">
            <div className="columns">
              <div className="column">
                <div className="field is-grouped">
                  <p className="control">
                    <LinkContainer to="/hot/new">
                      <a className="button is-info">New Hot Environment</a>
                    </LinkContainer>
                  </p>
                </div>
              </div>
              <div className="column" />
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
                {...this.state.tableOptions}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default HotEnvironments;
