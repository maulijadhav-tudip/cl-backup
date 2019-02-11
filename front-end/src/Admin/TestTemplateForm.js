import React, {Component} from "react";
import {LinkContainer} from "react-router-bootstrap";
import update from "immutability-helper";
import {Redirect} from "react-router-dom";
import {convertObjectIntoFormData} from "../Utils";
import {getHeaders} from "../Headers";

class TestTemplateForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rowId: props.match.params.name,
      testTemplate: {
        name: "",
        description: "",
      },
      test1: false,
      test2: false,
      test3: false,
      requiredTest: false,
      vmName: "",
      vmUsername: "",
      vmPassword: "",
      redirect: false,
      dataLoaded: false,
      test1Checked: false,
      test2Checked: false,
      test3Checked: false,
      tests: [],
      label: "",
      notification: false,
      notificationText: "",
      notificationType: "",
    };
  }

  componentDidMount() {
    const {type} = this.props;
    if (type === "new template") {
      this.setState({label: "New Test-Template"});
    } else {
      this.setState({label: "Edit Test-Template"});
      this.getTemplateData();
    }
  };

  getTemplateData = () => {
    const headers = getHeaders();
    const {rowId} = this.state;

    fetch("/api/ravello/edit-test-template/" + rowId, {
      method: "GET",
      headers: headers
    }).then((response) => {
      return response.json();
    }).then(json => {
      const {test_details, test_details: {testParams, testNames}} = json;
      this.setState({
          testTemplate: test_details,
          vmName: testParams && testParams.vmname,
          vmUsername: testParams && testParams.vmusername,
          vmPassword: testParams && testParams.vmpassword,
          tests: testNames,
          dataLoaded: true,
        }, () => {
          if (testNames.length !== 0) {
            this.setState({requiredTest: false});
          }
        }
      );
    }).catch((ex) => {
      console.log(ex);
    });
  };

  validateCheckBox = () => {
    const {tests} = this.state;
    if (tests.length === 0) {
      this.setState({requiredTest: true});
      return true;
    }
    this.setState({requiredTest: false});
    return false;
  };

  saveFormData = (e) => {
    if (this.validateCheckBox()) {
      e.preventDefault();
      return;
    }
    const headers = getHeaders();
    e.preventDefault();

    const data = {
      "name": this.refs.name.value,
      "description": this.refs.description.value,
      "test1": this.refs.test1.checked,
      "test2": this.refs.test2.checked,
      "test3": this.refs.test3.checked,
      "vmname": this.refs.vmName.value,
      "vmusername": this.refs.vmUsername.value,
      "password": this.refs.vmPassword.value,
    };

    const formData = convertObjectIntoFormData(data);

    let url = "", methodType = "";
    if (this.props.new === false) {
      const {rowId} = this.state;
      if (rowId !== "new") url = "edit-test-template/" + rowId;
      methodType = "PUT";
    } else {
      url = "test-template";
      methodType = "POST";
    }
    fetch("/api/ravello/" + url, {
      method: methodType,
      body: formData,
      headers: headers
    }).then((data) => {
      if (data.status === 200) {
        if (this.props.new === false) {
          this.setState({
            redirect: true,
          })
        } else {
          this.setState({
            notification: true,
            notificationText: "The details has been successfully submitted.",
            notificationType: "notification is-success",
            redirect: true,
          });
        }
      } else {
        this.setState({
          redirect: true,
          notification: true,
          notificationText: "An error has occured in submitting the request. Please Try again.",
          notificationType: "notification is-danger"
        });
      }
    }).catch((error) => {
      console.log("Request failure: ", error);
    });
  };

  toggleCheckbox = (event) => {
    const {tests} = this.state;
    const {name, value} = event.target;
    const checked = tests.indexOf(value);
    if (checked !== -1) {
      tests.splice(checked, 1);
      this.setState({[name]: false, tests});
    } else {
      tests.push(event.target.value);
      this.setState({[name]: false, tests, requiredTest: false});
    }
  };

  nameChange = (event) => {
    this.setState({
      testTemplate: update(this.state.testTemplate, {
        name: {$set: event.target.value}
      })
    });
  };

  descriptionChange = (event) => {
    this.setState({
      testTemplate: update(this.state.testTemplate, {
        description: {$set: event.target.value}
      })
    });
  };

  updateVMField = (event, key) => {
    this.setState({
      [key]: event.target.value
    })
  };

  render() {
    const {
      vmName,
      vmUsername,
      vmPassword,
      tests,
      redirect,
      testTemplate: {name, description},
      label,
      notification,
      notificationText,
      notificationType,
      requiredTest,
    } = this.state;
    const {nameChange, descriptionChange, toggleCheckbox, saveFormData, updateVMField} = this;
    const {type} = this.props;
    return (
      <section className="hero is-fullheight">
        <div className="box box-margin">
          {notification ? (
            <div className={notificationType}>{notificationText}</div>
          ) : null}
          {!redirect ? (
            <form onSubmit={saveFormData}>
              <label className="label header-style">{label}</label>
              <div className="div1-style">

                <div className="field is-horizontal">
                  <label className="label">Name</label>
                  <div className="control input-width name-align">
                    <input
                      className="input"
                      type="text"
                      ref="name"
                      placeholder="Template Name"
                      value={name}
                      onChange={nameChange}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="field is-horizontal">
                  <label className="label">Description</label>
                  <div className="control input-width desc-align">
                   <textarea
                     rows="1"
                     className="textarea"
                     ref="description"
                     placeholder="Test Description"
                     value={description}
                     onChange={descriptionChange}
                     autoFocus
                     required
                   />
                  </div>
                </div>

                <div className="control">
                  <div className="field is-horizontal">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        ref="test1"
                        name="test1"
                        value={"Test 1"}
                        checked={tests.indexOf("Test 1") !== -1}
                        onChange={toggleCheckbox}
                      />
                      <strong className="label tests-align">Test 1</strong>
                    </label>
                    <label className="checkbox-title-align">Env Status Check through API</label>
                  </div>
                </div>

                <div className="control">
                  <div className="field is-horizontal">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        ref="test2"
                        name="test2"
                        value="Test 2"
                        checked={tests.indexOf("Test 2") !== -1}
                        onChange={toggleCheckbox}
                      />
                      <strong className="label tests-align">Test 2</strong>
                    </label>
                    <label className="checkbox-title-align">Ping FW Management Interface</label>
                  </div>
                </div>

                <div className="control">
                  <div className="field is-horizontal">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        ref="test3"
                        name="test3"
                        value="Test 3"
                        checked={tests.indexOf("Test 3") !== -1}
                        onChange={toggleCheckbox}
                      />
                      <strong className="label tests-align">Test 3</strong>
                    </label>
                    <label className="checkbox-title-align">Firewall Functional Test (Job-1)</label>
                  </div>
                </div>

                {requiredTest &&
                  <div className="control">
                    <div className="field is-horizontal">
                      <label className="danger">*Please select at least one test.</label>
                    </div>
                  </div>
                }

              </div>

              <div className="div2-style">

                <label className="label parameter-align">Parameter:</label>
                <div>
                  <div className="field is-horizontal right-align">
                    <label className="label vmname-align">VM Name</label>
                    <div className="control input-width">
                      <input
                        className="input vm-imput-padd"
                        type="text"
                        ref="vmName"
                        placeholder="VM Name"
                        value={vmName}
                        onChange={(e) => updateVMField(e, 'vmName')}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="field is-horizontal right-align">
                  <label className="label vmusername-align">VM Username</label>
                  <div className="control input-width">
                    <input
                      className="input"
                      type="text"
                      ref="vmUsername"
                      placeholder="VM Username"
                      value={vmUsername}
                      onChange={(e) => updateVMField(e, 'vmUsername')}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="field is-horizontal right-align">
                  <label className="label vmpassword-align">VM Password</label>
                  <div className="control input-width">
                    <input
                      className="input"
                      type="password"
                      ref="vmPassword"
                      placeholder="VM Password"
                      value={vmPassword}
                      onChange={(e) => updateVMField(e, 'vmPassword')}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="field is-horizontal right-align">
                  <LinkContainer to="/test-template">
                    <a className="button is-info button-position">Cancel</a>
                  </LinkContainer>
                  <button type="submit" className="button is-info">
                    Save
                  </button>
                </div>
              </div>
            </form>) : type === "new template" ? (
            <div>
              <LinkContainer to="/test-template">
                <a className="button is-link">Back</a>
              </LinkContainer>
            </div>
          ) : <Redirect to="/test-template"/>
          }
        </div>
      </section>
    );
  }
}

export default TestTemplateForm;