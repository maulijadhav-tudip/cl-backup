import React, { Component } from "react";
import base64 from "base-64";
import "whatwg-fetch";
import ReactTable from "react-table";
import moment from "moment-timezone";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import checkboxHOC from "react-table/lib/hoc/selectTable";
import Downloader from "./components/Downloader";

const CheckboxTable = checkboxHOC(ReactTable);

class Requests extends Component {
  constructor(props) {
    super(props);
    this.getRequests = this.getRequests.bind(this);

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
      lastSelection: ""
    };
  }
  getRequests() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/requests", {
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

  approveSelection() {
    let selection = this.state.selection;
    selection.forEach(x => {
      let headers = new Headers();
      let formData = new FormData();
      formData.append("requestId", x);

      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(window.localStorage.getItem("authToken") + ":x")
      );
      fetch(`/api/approve`, {
        method: "POST",
        body: formData,
        headers: headers
      }).then(
        function(response) {
          this.getRequests();
        }.bind(this)
      );
    });
    this.setState({ selection: [] });
  }

  componentDidMount() {
    this.getRequests();
    this.interval = setInterval(() => this.getRequests(), 60000);
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
        x => x._original.requestId === this.state.lastSelection
      );
      let current = currentRecords.findIndex(
        x => x._original.requestId === clickedKey
      );
      for (let x = Math.min(last, current); x <= Math.max(last, current); x++) {
        if (currentRecords[x]._original.requestId !== this.state.lastSelection)
          keys.push(currentRecords[x]._original.requestId);
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
      },
      {
        Header: "First Name",
        accessor: "first",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["first"] }),
        filterAll: true
      },
      {
        Header: "Last Name",
        accessor: "last",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["last"] }),
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
        Header: "Last Request",
        accessor: "requestedOn",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows.map(x => {
              x["filter"] = moment(x.requestedOn.$date).format(
                "MMMM Do YYYY, h:mm:ss a Z"
              );
              return x;
            }),
            filter.value,
            { keys: ["filter"] }
          ),
        filterAll: true,
        Cell: row => (
          <p>
            {moment(row.value.$date).isValid()
              ? moment(row.value.$date).format("MMMM Do YYYY, h:mm:ss a Z")
              : null}
          </p>
        )
      },
      {
        Header: "Requests Today",
        accessor: "requestedEnvs",
        Cell: row => row.value.toString(),
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["requestedEnvs"] }),
        filterAll: true
      }
    ];

    return (
      <div>
        {this.state.logVisible ? (
          <div id="modal" className="modal is-active">
            <div className="modal-background" />
            <div className="modal-content">
              <div className="box">
                <Downloader type="request" />
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
                    <a
                      className="button is-info"
                      onClick={() => {
                        this.approveSelection();
                      }}
                    >
                      Approve Selection
                    </a>
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
            </div>
            <div className="box">
              <CheckboxTable
                keyField="requestId"
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

export default Requests;
