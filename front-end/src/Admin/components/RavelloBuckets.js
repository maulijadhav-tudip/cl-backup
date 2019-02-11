import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import base64 from "base-64";

class RavelloBuckets extends Component {
  static propTypes = {
    changeBucket: PropTypes.func.isRequired,
    bucketId: PropTypes.number.isRequired
  };
  constructor(props) {
    super(props);
    this.loadPolicies = this.loadPolicies.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      bucket: "",
      selected: 0,
      buckets: []
    };
  }
  //This function loads the dates of the data sets
  loadPolicies() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );
    fetch("/api/buckets", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let index = json.findIndex(x => x.id === this.props.bucketId);
        if (index === -1) index = 0;
        this.setState({
          buckets: json,
          bucket: json[index],
          selected: index
        });
        this.props.changeBucket(json[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadPolicies();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeBucket(this.state.buckets[e.value]);

    this.setState({
      bucket: this.state.buckets[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.buckets.length; j++) {
      options.push({
        value: j,
        label: this.state.buckets[j]["name"]
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

export default RavelloBuckets;
