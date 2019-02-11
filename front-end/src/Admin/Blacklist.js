import React, { Component } from "react";
import base64 from "base-64";
import "whatwg-fetch";
import ReactTable from "react-table";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import checkboxHOC from "react-table/lib/hoc/selectTable";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const CheckboxTable = checkboxHOC(ReactTable);

class Blacklist extends Component {
  constructor(props) {
    super(props);
    this.getList = this.getList.bind(this);
    this.deleteSelection = this.deleteSelection.bind(this);
    this.upload = this.upload.bind(this);
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
      selection: [],
      selectAll: false,
      data: [],
      lastSelection: "",
      email: ""
    };
  }
  getList() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/black", {
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
    this.getList();
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
      fetch(`/api/black/${x}/delete`, {
        method: "POST",
        headers: headers
      }).then(
        function(response) {
          this.getList();
        }.bind(this)
      );
    });
    this.setState({ selection: [] });
  }

  upload(x) {
    var data = new FormData();
    data.append("black-file", x.target.files[0]);

    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/black/upload", {
      method: "POST",
      headers: headers,
      body: data
    })
      .then(
        function(response) {
          this.getList();
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });
  }
  handleChange(event) {
    this.setState({ email: event.target.value });
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
    const columns = [
      {
        Header: "Email",
        accessor: "email",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["email"] }),
        filterAll: true
      }
    ];
    return (
      <div>
        <section className="section">
          <div className="container is-fluid">
            <h1 className="title">Blacklist</h1>

            <div className="columns">
              <div className="column">
                <div className="field is-grouped">
                  <p className="control">
                    <a
                      className="button is-info"
                      onClick={() => {
                        confirmAlert({
                          customUI: ({ onClose }) => {
                            return (
                              <div className="custom-ui">
                                <h1>
                                  Enter email (*@domain.org for entire domain)
                                </h1>
                                <label>
                                  Email:
                                  <input
                                    className="input"
                                    type="text"
                                    onChange={this.handleChange}
                                  />
                                </label>
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
                                        console.log(this.state.email);
                                        let headers = new Headers();
                                        let formData = new FormData();

                                        headers.append(
                                          "Authorization",
                                          "Basic " +
                                            base64.encode(
                                              window.localStorage.getItem(
                                                "authToken"
                                              ) + ":x"
                                            )
                                        );

                                        formData.append(
                                          "email",
                                          this.state.email
                                        );
                                        fetch("/api/black", {
                                          method: "POST",
                                          body: formData,
                                          headers: headers
                                        }).then(x => {
                                          this.getList();
                                        });

                                        onClose();
                                      }}
                                    >
                                      Add
                                    </button>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        });
                      }}
                    >
                      Add Email
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

export default Blacklist;
