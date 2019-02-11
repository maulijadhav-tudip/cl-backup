import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import base64 from "base-64";

class RavelloRegions extends Component {
  static propTypes = {
    changeRegion: PropTypes.func.isRequired,
    blueprintId: PropTypes.number.isRequired,
    region: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadRegions = this.loadRegions.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      region: "",
      selected: 0,
      regions: []
    };
  }
  //This function loads the dates of the data sets
  loadRegions() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );
    fetch("/api/locations/" + this.props.blueprintId, {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let regions = json.filter(x => {
          return !x["deprecated"];
        });

        let index = regions.findIndex(x => x.regionName === this.props.region);
        if (index === -1) index = 0;
        this.setState({
          regions: regions,
          region: regions[index],
          selected: index
        });
        this.props.changeRegion(regions[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadRegions();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeRegion(this.state.regions[e.value]);

    this.setState({
      region: this.state.regions[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.regions.length; j++)
      if (!this.state.regions[j]["deprecated"])
        options.push({
          value: j,
          label:
            this.state.regions[j]["cloudDisplayName"] +
            " " +
            this.state.regions[j]["regionDisplayName"]
        });

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

export default RavelloRegions;
