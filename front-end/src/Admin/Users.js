import React, { Component } from "react";
import base64 from "base-64";
import "whatwg-fetch";
import ReactTable from "react-table";
import moment from "moment-timezone";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import checkboxHOC from "react-table/lib/hoc/selectTable";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

import Scheduler from "./components/Scheduler";

const CheckboxTable = checkboxHOC(ReactTable);

class Users extends Component {
  constructor(props) {
    super(props);
    this.getUsers = this.getUsers.bind(this);
    this.deleteSelection = this.deleteSelection.bind(this);
    this.resetSelection = this.resetSelection.bind(this);
    this.upload = this.upload.bind(this);

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
      selection: [],
      selectAll: false,
      data: [],
      extendTime: "",
      lastSelection: ""
    };
  }
  getUsers() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/users", {
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
    this.getUsers();
    this.interval = setInterval(() => this.getUsers(), 60000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  toggleSelection = (clickedKey, shift, row) => {
    let keys = [];
    if (shift && this.state.lastSelection !== "") {
      const wrappedInstance = this.checkboxTable.getWrappedInstance();

      let currentRecords = wrappedInstance.getResolvedState().sortedData;
      const state = wrappedInstance.getResolvedState();

      currentRecords = currentRecords.slice(
        state.page * state.pageSize,
        (state.page + 1) * state.pageSize
      );

      let last = currentRecords.findIndex(
        x => x.email === this.state.lastSelection
      );
      let current = currentRecords.findIndex(x => x.email === clickedKey);
      for (let x = Math.min(last, current); x <= Math.max(last, current); x++) {
        if (currentRecords[x].email !== this.state.lastSelection)
          keys.push(currentRecords[x].email);
      }
      this.setState({ lastSelection: "" });
    } else {
      keys.push(clickedKey);
      this.setState({ lastSelection: clickedKey });
    }
    let selection = [...this.state.selection];
    keys.forEach(key => {
      const keyIndex = selection.indexOf(key);
      if (keyIndex >= 0) {
        selection = [
          ...selection.slice(0, keyIndex),
          ...selection.slice(keyIndex + 1)
        ];
      } else {
        selection.push(key);
      }
    });
    this.setState({ selection });
  };

  toggleAll = () => {
    const selectAll = this.state.selectAll ? false : true;
    const selection = [];
    if (selectAll) {
      const wrappedInstance = this.checkboxTable.getWrappedInstance();

      let currentRecords = wrappedInstance.getResolvedState().sortedData;
      const state = wrappedInstance.getResolvedState();

      currentRecords = currentRecords.slice(
        state.page * state.pageSize,
        (state.page + 1) * state.pageSize
      );

      currentRecords.forEach(item => {
        selection.push(item._original.email);
      });
    }
    this.setState({ selectAll, selection });
  };

  isSelected = key => {
    return this.state.selection.includes(key);
  };

  deleteSelection() {
    let selection = this.state.selection;
    selection.forEach(x => {
      let headers = new Headers();
      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(window.localStorage.getItem("authToken") + ":x")
      );
      fetch(`/api/users/${x}/delete`, {
        method: "POST",
        headers: headers
      }).then(
        function(response) {
          this.getUsers();
        }.bind(this)
      );
    });
    this.setState({ selection: [] });
  }

  extendSelection() {
    let selection = this.state.selection;
    selection.forEach(x => {
      let headers = new Headers();
      let formData = new FormData();
      formData.append("endTime", this.state.extendTime);

      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(window.localStorage.getItem("authToken") + ":x")
      );
      fetch(`/api/users/${x}/extend`, {
        method: "POST",
        body: formData,
        headers: headers
      }).then(
        function(response) {
          this.getUsers();
        }.bind(this)
      );
    });
    this.setState({ selection: [] });
  }
  resetSelection() {
    let selection = this.state.selection;
    selection.forEach(x => {
      let headers = new Headers();
      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(window.localStorage.getItem("authToken") + ":x")
      );
      fetch(`/api/users/${x}/reset`, {
        method: "POST",
        headers: headers
      }).then(
        function(response) {
          this.getUsers();
        }.bind(this)
      );
    });
    this.setState({ selection: [] });
  }
  upload(x) {
    var data = new FormData();
    data.append("file", x.target.files[0]);

    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/upload", {
      method: "POST",
      headers: headers,
      body: data
    })
      .then(
        function(response) {
          this.getUsers();
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  render() {
    const { toggleSelection, toggleAll, isSelected } = this;
    const { data, selectAll } = this.state;
    const checkboxProps = {
      selectAll,
      isSelected,
      toggleSelection,
      toggleAll,
      selectType: "checkbox"
    };
    let columns = [
      {
        Header: "Email",
        accessor: "email",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["email"] }),
        filterAll: true
      },
      {
        Header: "Lab",
        accessor: "lab.name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["lab"] }),
        filterAll: true
      },

      {
        Header: "Start Time",
        accessor: "startTime",
        maxWidth: 350,
        filterMethod: (filter, rows) =>
          matchSorter(
            rows.map(x => {
              x["startFilter"] = moment(x.startTime.$date).format(
                "MMMM Do YYYY, h:mm:ss a Z"
              );
              return x;
            }),
            filter.value,
            { keys: ["startFilter"] }
          ),
        filterAll: true,
        Cell: row => (
          <p>
            {moment(row.value).isValid()
              ? moment(row.value.$date).format("MMMM Do YYYY, h:mm:ss a Z")
              : null}
          </p>
        )
      },
      {
        Header: "End Time",
        accessor: "endTime",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows.map(x => {
              x["endFilter"] = moment(x.endTime.$date).format(
                "MMMM Do YYYY, h:mm:ss a Z"
              );
              return x;
            }),
            filter.value,
            { keys: ["endFilter"] }
          ),
        filterAll: true,
        maxWidth: 350,
        Cell: row => (
          <p>
            {moment(row.value).isValid()
              ? moment(row.value.$date).format("MMMM Do YYYY, h:mm:ss a Z")
              : null}
          </p>
        )
      },
      {
        Header: "Created App",
        accessor: "createdApp",
        Cell: row => row.value.toString(),
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["createdApp"] }),
        filterAll: true
      },
      {
        Header: "Published App",
        accessor: "createdToken",
        Cell: row => row.value.toString(),
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["createdToken"] }),
        filterAll: true
      },
      {
        Header: "Accessed Portal",
        accessor: "loggedIn",
        Cell: row => row.value.toString(),
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["loggedIn"] }),
        filterAll: true
      },
      {
        Header: "Role",
        accessor: "role",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["role"] }),
        filterAll: true
      }
    ];
    if (this.props.seat) {
      columns.push({
        Header: "Seat Number",
        accessor: "seatNumber",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["seatNumber"] }),
        filterAll: true,
        Cell: row => <p>{row.value !== "null" ? row.value : null}</p>
      });
    }
    if (this.props.role === "admin") {
      columns.push({
        Header: "Edit",
        maxWidth: 100,
        accessor: "email",
        Cell: row => (
          <Link
            to={`/users/${row.value}`}
            className="button is-info is-fullwidth"
          >
            Edit
          </Link>
        ),
        filterable: false
      });
    }

    return (
      <div>
        <section className="section">
          <div className="container is-fluid">
            {this.props.role === "admin" ? (
              <div className="columns">
                <div className="column">
                  <div className="field is-grouped">
                    <p className="control">
                      <LinkContainer to="/users/new">
                        <a className="button is-info">New User</a>
                      </LinkContainer>
                    </p>
                    <p className="control">
                      <a
                        className="button is-info"
                        onClick={() => {
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <div className="custom-ui">
                                  <h1>
                                    Upload a CSV file with a single column
                                    containing emails to add.
                                  </h1>
                                  <input type="file" onChange={this.upload} />

                                  <div className="field is-grouped">
                                    <p className="control">
                                      <button
                                        className="button is-primary"
                                        onClick={onClose}
                                      >
                                        Close
                                      </button>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          });
                        }}
                      >
                        Upload CSV
                      </a>
                    </p>
                    <p className="control">
                      <a
                        className="button is-info"
                        onClick={() => {
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <div className="custom-ui">
                                  <h1>Enter new environment end time.</h1>
                                  <Scheduler
                                    changeDate={x =>
                                      this.setState({
                                        extendTime: x.toISOString()
                                      })
                                    }
                                    timezone={moment.tz.guess()}
                                    time={moment()}
                                  />
                                  <div className="field is-grouped">
                                    <p className="control">
                                      <button
                                        className="button is-primary"
                                        onClick={onClose}
                                      >
                                        Cancel
                                      </button>
                                    </p>
                                    <p className="control">
                                      <button
                                        className="button is-danger"
                                        onClick={() => {
                                          this.extendSelection();
                                          onClose();
                                        }}
                                      >
                                        Extend
                                      </button>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          });
                        }}
                      >
                        Extend Selection
                      </a>
                    </p>
                    <p className="control">
                      <a
                        className="button is-danger"
                        onClick={() => {
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <div className="custom-ui">
                                  <h1>
                                    Are you sure you want to reset these users?
                                  </h1>
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
                                          this.resetSelection();
                                          onClose();
                                        }}
                                      >
                                        Reset
                                      </button>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          });
                        }}
                      >
                        Reset Selection
                      </a>
                    </p>
                    <p className="control">
                      <a
                        className="button is-danger"
                        onClick={() => {
                          confirmAlert({
                            customUI: ({ onClose }) => {
                              return (
                                <div className="custom-ui">
                                  <h1>
                                    Are you sure you want to delete these users?
                                  </h1>

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
                                          this.deleteSelection();
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
                      >
                        Delete Selection
                      </a>
                    </p>
                  </div>
                </div>
                <div className="column" />
                <div className="column" />
              </div>
            ) : null}
            <div className="box">
              <CheckboxTable
                keyField="email"
                ref={r => (this.checkboxTable = r)}
                className="-striped -highlight"
                data={data}
                columns={columns}
                defaultFilterMethod={(filter, row) =>
                  String(row[filter.id]) === filter.value
                }
                {...this.state.tableOptions}
                {...checkboxProps}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Users;
