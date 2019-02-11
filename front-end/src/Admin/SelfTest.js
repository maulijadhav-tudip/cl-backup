import React, {Component} from "react";
import "whatwg-fetch";
import ReactTable from "react-table";
import "react-table/react-table.css";
import checkboxHOC from "react-table/lib/hoc/selectTable";
import matchSorter from "match-sorter";
import {confirmAlert} from "react-confirm-alert";
import Refresh from "../Image/icons8-refresh-28.png";
import {convertObjectIntoFormData} from "../Utils";
import {getHeaders} from "../Headers";
import Spinner from "../Spinner";

const CheckboxTable = checkboxHOC(ReactTable);

class SelfTest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            selfTestTableData: [],
            templateValue: {},
            selectAll: false,
            mySelection: [],
            selection: [],
            data: [],
            lastSelection: "",
            selectRunDisabled: true,
            dropdownDisabled: true,
            environmentId: "",
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
    };

    componentDidMount() {
        this.getTableData();
        this.getTemplateNames();
    };

    getTemplateNames = () => {
        const headers = getHeaders();

        fetch("/api/ravello/test-template", {
            method: "GET",
            headers: headers
        }).then((response) => {
            return response.json();
        }).then(json => {
            this.setState({
                data: json.test_details,
            });
        }).catch((ex) => {
            console.log(ex);
        });
    };

    postSelectedRows = () => {
        const {mySelection, templateValue} = this.state;
        const {getTableData} = this;
        const headers = getHeaders();
        const selection = mySelection.map(row => {
            if (row._id.startsWith('selftest')) {
                delete row._id;
                return row;
            } else {
                return row;
            }
        });
        const data = {
            "mySelection": JSON.stringify(selection),
            "testTemplate": JSON.stringify(templateValue),
        };
        const formData = convertObjectIntoFormData(data);

        fetch(`/api/ravello/test-detail`, {
            method: "POST",
            body: formData,
            headers: headers,
        }).then((data) => {
            if (data.status === 200) {
                getTableData();
            }
            this.setState({selection: [], dropdownDisabled: true, selectRunDisabled: true});
        }).catch(function (error) {
            console.log("Request failure: ", error);
        });
    };

    getTableData = () => {
        const headers = getHeaders();
        this.setState({loading: true});
        setTimeout(() => {
            fetch("/api/ravello/test-detail", {
                method: "GET",
                headers: headers
            }).then((response) => {
                return response.json();
            }).then(json => {
                let pageSizeOptions = [5, 10, 20, 25, 50, 100];
                this.setState({
                    loading: false,
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
                    selfTestTableData: json.env_test.map(x => {
                        return {
                            _id: x._id ?
                                x._id.$oid :
                                `selftest${x.environmentId},${x.environment_name},${x.assigned}${x.class}${x.testTemplate && x.testTemplate}`,
                            assigned: x.assigned,
                            class: x.class,
                            environmentId: x.environmentId,
                            environment_name: x.environment_name,
                            status: x.status,
                            testTemplate: x.testTemplate,
                        }
                    }),
                    selectRunDisabled: true,
                    dropdownDisabled: true,
                    selectAll: false,
                    mySelection: [],
                    selection: [],
                });
            }).catch((ex) => {
                console.log(ex);
            });
        }, 500);

    };

    getTemplateData = (rowId) => {
        const headers = getHeaders();

        fetch("/api/ravello/edit-test-template/" + rowId, {
            method: "GET",
            headers: headers
        }).then((response) => {
            return response.json();
        }).then(json => {
            this.setState({templateValue: json.test_details, selectRunDisabled: false});
        }).catch((ex) => {
            console.log(ex);
        });
    };

    setTemplateNameForSelectedRows(event) {
        const selectedIndex = event.target.options.selectedIndex;
        const rowId = event.target.options[selectedIndex].getAttribute('data-key');
        this.getTemplateData(rowId);
    };

    restartTest = (row) => {
        const {getTableData} = this;
        const headers = getHeaders();

        fetch(`/api/ravello/restart-test/` + row._id, {
            method: "PUT",
            headers: headers,
        }).then((data) => {
            if (data.status === 200) {
                getTableData();
            }
            this.setState({selection: [], dropdownDisabled: true, selectRunDisabled: true});
        }).catch(function (error) {
            console.log("Request failure: ", error);
        });
    };

    restartTest2 = (row) => {
        const {getTableData} = this;
        const headers = getHeaders();

        const data = {
            "mySelection": JSON.stringify(row),
        };
        const formData = convertObjectIntoFormData(data);

        fetch(`/api/ravello/restart-test`, {
            method: "POST",
            body: formData,
            headers: headers,
        }).then((data) => {
            if (data.status === 200) {
                getTableData();
            }
            this.setState({selection: [], dropdownDisabled: true, selectRunDisabled: true});
        }).catch(function (error) {
            console.log("Request failure: ", error);
        });
    };

    toggleSelection = (clickedKey, shift, row) => {
        const {lastSelection, templateValue} = this.state;
        const {checkboxTable} = this;
        let keys = [];
        if (shift && lastSelection !== "") {
            const wrappedInstance = checkboxTable.getWrappedInstance();

            let currentRecords = wrappedInstance.getResolvedState().sortedData;
            const state = wrappedInstance.getResolvedState();

            currentRecords = currentRecords.slice(
                state.page * state.pageSize,
                (state.page + 1) * state.pageSize
            );

            let last = currentRecords.findIndex(
                record => record._id === lastSelection
            );
            let current = currentRecords.findIndex(record => record._id === clickedKey);
            for (let record = Math.min(last, current); record <= Math.max(last, current); record++) {
                if (currentRecords[record]._id !== lastSelection)
                    keys.push(currentRecords[record]._id);
            }
            this.setState({lastSelection: ""});
        } else {
            keys.push(clickedKey);
            this.setState({lastSelection: clickedKey});
        }
        let selection = [...this.state.selection];
        let mySelection = [...this.state.mySelection];
        keys.forEach(key => {
            const keyIndex = selection.indexOf(key);

            if (Object.keys(templateValue).length !== 0)
                this.setState({dropdownDisabled: false, selectRunDisabled: false});

            if (keyIndex >= 0) {
                selection = [
                    ...selection.slice(0, keyIndex),
                    ...selection.slice(keyIndex + 1)
                ];
                mySelection = [
                    ...mySelection.slice(0, keyIndex),
                    ...mySelection.slice(keyIndex + 1)
                ]
            } else {
                selection.push(key);
                mySelection.push(row);
            }
        });
        if (selection.length === 0) {
            this.setState({dropdownDisabled: true, selectRunDisabled: true})
        } else {
            this.setState({dropdownDisabled: false})
        }
        this.setState({selection, mySelection});
    };

    toggleAll = () => {
        const {templateValue} = this.state;
        const selectAll = !this.state.selectAll;
        const selection = [];
        let mySelection = [];
        if (selectAll) {
            const wrappedInstance = this.checkboxTable.getWrappedInstance();

            let currentRecords = wrappedInstance.getResolvedState().sortedData;
            const state = wrappedInstance.getResolvedState();

            currentRecords = currentRecords.slice(
                state.page * state.pageSize,
                (state.page + 1) * state.pageSize
            );
            currentRecords.forEach(item => {
                selection.push(item._original._id);
                mySelection.push(item._original);
            });
            this.setState({dropdownDisabled: false});
            if (Object.keys(templateValue).length !== 0)
                this.setState({dropdownDisabled: false, selectRunDisabled: false});
        } else {
            this.setState({dropdownDisabled: true, selectRunDisabled: true})
        }
        this.setState({selectAll, selection, mySelection});
    };

    isSelected = key => {
        return this.state.selection.includes(key);
    };

    popupHeading = (type) => {
        if (type === "restart") {
            return "Do you want to restart the test?"
        } else {
            return "Do you want to run the test?"
        }
    };
    popup = (type, row) => {
        const {postSelectedRows, getTableData, popupHeading} = this;
        confirmAlert({
            customUI: ({onClose}) => {
                return (
                    <div className="custom-ui">
                        <h1 className="font-size">
                            {popupHeading(type)}
                        </h1>

                        <div className="pop-up-style">
                            <p className="control pop-up-padding">
                                <button className="button is-info is-fullwidth" onClick={onClose}>
                                    Cancel
                                </button>
                            </p>

                            <p className="control">
                                <button
                                    className="button is-info is-fullwidth"
                                    onClick={() => {
                                        if (type === "restart") {
// this.restartTest(row);
                                            this.restartTest2(row);
                                            onClose();
                                            getTableData();
                                        } else {
                                            postSelectedRows();
                                            onClose();
                                            getTableData();
                                        }
                                    }}
                                >
                                    Run
                                </button>
                            </p>
                        </div>
                    </div>
                );
            }
        });
    };

    render() {
        const {toggleSelection, isSelected, toggleAll, getTableData, popup} = this;
        const {
            data,
            selectAll,
            selectRunDisabled,
            dropdownDisabled,
            selfTestTableData,
            tableOptions,
            loading,
        } = this.state;
        const optionItems = data.map((data) =>
            <option value={data.name} data-key={data._id.$oid}>{data.name}</option>
        );
        const checkboxProps = {
            selectAll,
            toggleAll,
            toggleSelection,
            isSelected,
            selectType: "checkbox",
        };
        const columns = [
            {
                Header: "Env",
                accessor: "environment_name",
                className: "head-style",
                filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["environment_name"]}),
                filterAll: true,
                maxWidth: 400,
            },
            {
                Header: "Assigned",
                accessor: "assigned",
                className: "head-style",
                filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["assigned"]}),
                filterAll: true,
                maxWidth: 100,
            },
            {
                Header: "Class",
                accessor: "class",
                className: "head-style",
                filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["class"]}),
                filterAll: true,
                maxWidth: 150,
            },
            {
                Header: "Test Status",
                accessor: "status",
                className: "head-style",
                filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["status"]}),
                filterAll: true,
                maxWidth: 100,
            },
            {
                Header: "Test Template",
                accessor: "testTemplate",
                className: "head-style",
                filterMethod: (filter, rows) => matchSorter(rows, filter.value, {keys: ["testTemplate"]}),
                filterAll: true,
                maxWidth: 200,

            },
            {
                Header: "Restart",
                className: "head-style",
                Cell: row => {
                    if (row.original.status === "In progress" || row.original.status === undefined) {
                        return <button className="button is-info" disabled>Restart</button>
                    } else {
                        return <button className="button is-info" onClick={() => {
                            popup("restart", row.original);
                        }}>Restart</button>
                    }
                },
                filterable: false,
                maxWidth: 150,
            },
        ];
        return (
            <div>
                {loading && <Spinner/>}
                <section className="section">
                    <div className="container is-fluid">
                        <div className="columns">
                            <div className="column">
                                <div className="field display-flex">
                                    <p className="control">
                                        <a
                                            className="button is-info"
                                            onClick={() => {
                                                if (selectRunDisabled === false) {
                                                    popup();
                                                }
                                            }}
                                            disabled={selectRunDisabled}
                                        >
                                            Select and Run Test
                                        </a>
                                    </p>
                                    <select
                                        onChange={event => this.setTemplateNameForSelectedRows(event)}
                                        disabled={dropdownDisabled}
                                        className="padding"
                                    >
                                        <option hidden>Select Template Name</option>
                                        {optionItems}
                                    </select>
                                </div>
                                <div className="refresh-button-align">
                                    <button className="refresh-button-style" onClick={getTableData}>
                                        {loading && <Spinner/>}
                                        <img src={Refresh} alt="Restart" className="image-style"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="box">
                            <CheckboxTable
                                keyField="_id"
                                ref={r => (this.checkboxTable = r)}
                                className="-striped -highlight"
                                data={selfTestTableData}
                                columns={columns}
                                defaultFilterMethod={(filter, row) => String(row[filter.id]) === filter.value}
                                {...tableOptions}
                                {...checkboxProps}
                            />
                        </div>
                    </div>
                </section>
            </div>
        );
    }
}

export default SelfTest;