import React, { Component } from "react";
import "whatwg-fetch";

import PropTypes from "prop-types";
import base64 from "base-64";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { DateRangePicker } from "react-date-range";
import moment from "moment";

class Downloader extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);

    this.state = {
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection"
      }
    };
  }

  render() {
    return (
      <div className="has-text-centered">
        <h1 className="title">Select a date range to retrieve logs</h1>
        <h4 className="subtitle">(Browser Timezone)</h4>
        <div className="box">
          <DateRangePicker
            ranges={[this.state.dateRange]}
            maxDate={new Date()}
            onChange={x => {
              this.setState({ dateRange: x["selection"] });
            }}
          />
        </div>
        <div
          className="button is-info is-fullwidth"
          onClick={x => {
            let startTime = moment(this.state.dateRange["startDate"]);
            let endTime = moment(this.state.dateRange["endDate"]);
            let headers = new Headers();
            headers.append(
              "Authorization",
              "Basic " +
                base64.encode(window.localStorage.getItem("authToken") + ":x")
            );
            let formData = new FormData();

            formData.append("startTime", startTime.toISOString());
            formData.append("endTime", endTime.toISOString());

            fetch(`/api/logs/${this.props.type}`, {
              method: "POST",
              headers: headers,
              body: formData
            })
              .then(response => {
                return response.text();
              })
              .then(text => {
                var downloadLink = document.createElement("a");
                var blob = new Blob([text], { type: "text/csv" });
                var url = URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download =
                  startTime.format("MM-DD-YYYY") +
                  "_" +
                  endTime.format("MM-DD-YYYY") +
                  "_" +
                  this.props.type +
                  "_log.csv";
                downloadLink.click();
              });
          }}
        >
          Download
        </div>
      </div>
    );
  }
}

export default Downloader;
