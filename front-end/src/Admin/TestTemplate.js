import React, {Component} from "react";
import "whatwg-fetch";
import ReactTable from "react-table";
import "react-table/react-table.css";
import {LinkContainer} from "react-router-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import {Link} from "react-router-dom";
import matchSorter from "match-sorter";
import {confirmAlert} from "react-confirm-alert";
import {getHeaders} from "../Headers";

class TestTemplate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 0,
      data: [],
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
    };
  }

  componentDidMount() {
    this.getTableData();
  }

  getTableData = () => {
    const headers = getHeaders();

    fetch("/api/ravello/test-template", {
      method: "GET",
      headers: headers,
    }).then((response) => {
      return response.json();
    }).then(json => {
      let pageSizeOptions = [5, 10, 20, 25, 50, 100];
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
          pageSizeOptions: pageSizeOptions.sort(function (a, b) {
            return a - b;
          })
        },
        data: json.test_details,
      });
    }).catch((ex) => {
      console.log(ex);
    });
  };

  deleteFormData = (row) => {
    const {getTableData} = this;
    const headers = getHeaders();

    fetch(`/api/ravello/edit-test-template/${row.value}`, {
      method: "DELETE",
      headers: headers
    }).then(() => {
        getTableData();
      }
    );
  };

  render() {
    const {data, tableOptions} = this.state;
    const {deleteFormData} = this;
    const columns = [
      {
        Header: "Self-Test Template (Name)",
        accessor: "name",
        className: "head-style",
        maxWidth: 300,
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["name"]}),
        filterAll: true
      },
      {
        Header: "Description",
        accessor: "description",
        className: "head-style",
        filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["description"]}),
        filterAll: true
      },
      {
        Header: "Edit",
        className: "header-style",
        accessor: "_id.$oid",
        maxWidth: 100,
        Cell: row => (
          <Link to={`/edit-test-template/${row.value}`} className="button is-info edit-button-style">Edit</Link>
        ),
        filterable: false
      },
      {
        Header: "Delete",
        className: "header-style",
        accessor: "_id.$oid",
        maxWidth: 100,
        Cell: row => (
          <a
            onClick={() => {
              confirmAlert({
                customUI: ({onClose}) => {
                  return (
                    <div className="custom-ui">
                      <h1>Are you sure you want to delete this template?</h1>

                      <div className="pop-up-style">
                        <p className="control pop-up-padding">
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
                              deleteFormData(row);
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
            className="button is-danger"
          >
            Delete
          </a>
        ),
        filterable: false
      },

    ];
    return (
      <div>
        <section className="section">
          <div className="container is-fluid">
            <div className="columns">
              <div className="column">
                <div className="field is-grouped">
                  <p className="control">
                    <LinkContainer to="/new-test-template">
                      <a className="button is-info">New Test Template</a>
                    </LinkContainer>
                  </p>
                </div>
              </div>
              <div className="column"/>
              <div className="column"/>
              <div className="column"/>
            </div>

            <div className="box">
              <ReactTable
                className="-striped -highlight"
                data={data}
                columns={columns}
                defaultFilterMethod={(filter, row) =>
                  String(row[filter.id]) === filter.value
                }
                {...tableOptions}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default TestTemplate;
