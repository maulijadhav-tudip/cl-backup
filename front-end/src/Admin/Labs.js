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
class Labs extends Component {
  constructor(props) {
    super(props);
    this.getLabs = this.getLabs.bind(this);
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
      data: []
    };
  }
  getLabs() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );

    fetch("/api/labs", {
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
    this.getLabs();
  }

  render() {
    const data = this.state.data;
    const columns = [
      {
        Header: "Enabled",
        accessor: "enabled",
        maxWidth: 100,
        Cell: row => (
          <span>
            <span
              style={{
                color: row.value === "false" ? "#ff2e00" : "#57d500",
                transition: "all .3s ease"
              }}
            >
              &#x25cf;
            </span>
            {row.value === "false" ? "Disabled" : "Enabled"}
          </span>
        )
      },
      {
        Header: "Name",
        accessor: "name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["name"] }),
        filterAll: true
      },
      {
        Header: "Description",
        accessor: "description",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["description"] }),
        filterAll: true
      },
      {
        Header: "Cloud Service",
        accessor: "type",
        maxWidth: 100,
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["type"] }),
        filterAll: true
      },
      {
        Header: "Blueprint",
        accessor: "blueprint.name",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["blueprint"] }),
        filterAll: true
      },
      {
        Header: "Optimization Level",
        accessor: "optimizationLevel",
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["optimizationLevel"] }),
        filterAll: true
      },
      {
        Header: "Region",
        accessor: "region",
        Cell: row => (
          <p>
            {row.value.friendlyName
              ? row.value.friendlyName
              : row.value.display_name
                ? row.value.display_name
                : row.value}
          </p>
        ),
        filterMethod: (filter, rows) =>
          matchSorter(rows, filter.value, { keys: ["region"] }),
        filterAll: true
      },

      {
        Header: "Download Markdown",
        maxWidth: 200,
        accessor: "markdown",
        filterable: false,
        Cell: row => (
          <div>
            {row.value ? (
              <div
                className="button is-info is-fullwidth"
                onClick={x => {
                  var element = document.createElement("a");
                  var file = new Blob([row.value], { type: "text/markdown" });
                  element.href = URL.createObjectURL(file);
                  element.download = row.original.name + ".md";
                  element.click();
                }}
              >
                Download
              </div>
            ) : (
              <p>No File Available</p>
            )}
          </div>
        )
      },
      {
        Header: "Edit",
        maxWidth: 100,
        accessor: "_id.$oid",
        Cell: row => (
          <Link
            to={`/lab/${row.value}`}
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
        accessor: "_id.$oid",
        Cell: row => (
          <a
            onClick={() => {
              confirmAlert({
                customUI: ({ onClose }) => {
                  return (
                    <div className="custom-ui">
                      <h1>Are you sure you want to delete this lab?</h1>

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
                              fetch(`/api/labs/${row.value}/delete`, {
                                method: "POST",
                                headers: headers
                              }).then(
                                function(response) {
                                  this.getLabs();
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
                    <LinkContainer to="/lab/ravello">
                      <a className="button is-info">New Ravello Lab</a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer to="/lab/cloudshare">
                      <a className="button is-info">New Cloudshare Lab</a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer to="/lab/azure">
                      <a className="button is-info">New Azure Lab</a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer to="/lab/qwiklab">
                    <a className="button is-info">New Qwiklabs</a>
                    </LinkContainer>
                  </p>
                  <p className="control">
                    <LinkContainer to="/lab/custom">
                      <a className="button is-info">New Custom Lab</a>
                    </LinkContainer>
                  </p>
                </div>
              </div>
              <div className="column" />
              <div className="column" />
              <div className="column" />
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

export default Labs;