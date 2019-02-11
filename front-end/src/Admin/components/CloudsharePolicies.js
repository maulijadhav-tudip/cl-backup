import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import base64 from "base-64";

class CloudsharePolicies extends Component {
  static propTypes = {
    changePolicy: PropTypes.func.isRequired,
    policyId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadPolicies = this.loadPolicies.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      policy: "",
      selected: 0,
      policies: []
    };
  }
  //This function loads the dates of the data sets
  loadPolicies() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );
    fetch("/api/cloudshare/policies", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let index = json.findIndex(x => x.id === this.props.policyId);
        if (index === -1) index = 0;
        this.setState({
          policies: json,
          policy: json[index],
          selected: index
        });
        this.props.changePolicy(json[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadPolicies();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.projectId !== this.props.projectId) {
      this.loadPolicies();
    }
  }
  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changePolicy(this.state.policies[e.value]);

    this.setState({
      policy: this.state.policies[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.policies.length; j++) {
      options.push({
        value: j,
        label: this.state.policies[j]["name"]
      });
    }

    return (
      <div>
        <Select
          className="is-fullwidth"
          value={this.state.selected}
          options={options}
          onChange={e => this.handleChange(e)}
        />
      </div>
    );
  }
}

export default CloudsharePolicies;
