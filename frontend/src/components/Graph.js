import React from 'react'
import { Loader, Dimmer } from 'semantic-ui-react'
import { Line } from 'react-chartjs-2'
import { DateTime, Duration } from 'luxon'
import axios from "../axiosConfig"
import TimeRange from "./TimeRange"

class LineChart extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      labels: [],
      dayData: {},
      minuteData: {},
    }
  }

  componentDidMount() {
    this.loadStockData()
    this.loadLabels()
  }

  componentDidUpdate(prevProps) {
    if (this.props.stocks !== prevProps.stocks) {
      this.loadStockData()
    }
    if (this.props.increment !== prevProps.increment) {
      this.loadLabels()
    }
    if (this.props.range !== prevProps.range) {
      this.loadLabels()
    }
  }

  previousMarketOpen(datetime) {
    var result = datetime
    result.set({ second: 0 })

    if (datetime.hour >= 16) {
      // If time is after 4pm
      result.set({ hour: 15, minute: 59})
    }
    else if ((datetime.hour === 9 && datetime.minute < 30) || (datetime.hour < 9)) {
      // If time is before 9:30am
      result = result.minus(Duration.fromObject({ days: 1 }))
      result.set({ hour: 15, minute: 59})
    }

    if (result.weekday > 5) {
      // if day is on a Sunday or Monday
      result.set({ weekday: 5, hour: 15, minute: 59 })
    }

    return datetime
  }

  loadStockData() {
    var requests = []
    for (let stock of this.props.stocks) {
      requests.splice(requests.length, 0,
        axios.get("api/get-stock-day-bar/" + stock.symbol + "/")
      )
    }
    for (let stock of this.props.stocks) {
      requests.splice(requests.length, 0,
        axios.get("api/get-stock-minute-bar/" + stock.symbol + "/")
      )
    }
    Promise.all(requests).then((res) => {
      var dayData = {}, minuteData = {}
      var numStocks = this.props.stocks.length
      for (let i = 0; i < numStocks; i++) {
        dayData[this.props.stocks[i].symbol] = res[i].data.dayBar
      }
      for (let i = 0; i < numStocks; i++) {
        minuteData[this.props.stocks[i].symbol] = res[i+numStocks].data.minuteBar
      }
      this.setState({dayData: dayData, minuteData: minuteData})
    })
  }

  loadLabels() {
    var labels = []
    var increment = TimeRange.fromString(this.props.increment)
    var range = TimeRange.fromString(this.props.range)
    var currTime = this.previousMarketOpen(DateTime.utc().setZone('UTC-4'))
    var incrementDuration = Duration.fromObject({
      [increment.unit + "s"]: increment.number
    })
    var goalTime = currTime.minus(Duration.fromObject({
      [range.unit + "s"]: range.number
    }))

    while (currTime.toMillis() >= goalTime.toMillis()) {
      if (increment.unit === "minute" || increment.unit === "hour") {
        // use minute bar data
        labels.splice(0, 0, currTime.toISO({
          suppressMilliseconds: true,
          includeOffset: false
        }))
      }
      else {
        // use day bar data
        labels.splice(0, 0, currTime.toISODate())
      }
      currTime = this.previousMarketOpen(currTime.minus(incrementDuration))
    }

    return labels
  }

  getDatasets() {
    var result = []
    var increment = TimeRange.fromString(this.props.increment)
    if (increment.unit === "minute" || increment.unit === "hour") {
      for (let stockSymbol in this.state.minuteData) {
        let stockData = []
        let stockColor = this.props.stocks.filter((stock) => {
          return stock.symbol === stockSymbol
        })[0].color
        result.splice(result.length, 0, {
          label: stockSymbol,
          borderColor: stockColor,
          backgroundColor: '#00000000',
          borderWidth: 2,
          data: stockData,
        })
      }
    }
    else {
      for (let stockSymbol in this.state.dayData) {
        let stockData = []
        let stockColor = this.props.stocks.filter((stock) => {
          return stock.symbol === stockSymbol
        })[0].color
        result.splice(result.length, 0, {
          label: stockSymbol,
          borderColor: stockColor,
          backgroundColor: '#00000000',
          borderWidth: 2,
          data: stockData,
        })
      }
    }
    return result
  }

  render() {
    // if (this.state.loading) {
    //   return (
    //     <div style = {{ height: `${window.innerHeight - 80}px` }}>
    //       <Dimmer style = {{backgroundColor: '#00000000'}} active>
    //         <Loader />
    //       </Dimmer>
    //     </div>
    //   )
    // }
    return (
      <div style = {{ height: `${window.innerHeight - 80}px` }}>
        <Line
          data = {{
            labels: this.state.labels,
            datasets: this.getDatasets()
          }}
          options = {{
            maintainAspectRatio: false,
            legend: { display: false },
            scales: {
              yAxes: [{
                ticks: {
                  min: 0,
                  max: 1000,
                  stepSize: 50,
                  callback: (val, index) => {
                    return val % 50 === 0 ? val : '';
                  },
                },
                gridLines: { color: "#707070" }
              }],
              xAxes: [{
                type: 'time',
                time: { unit: 'day' },
                gridLines: { color: "#707070" }
              }]
            },
            chartArea: { backgroundColor: '#2B2D30' }
          }}
        />
      </div>
    )
  }
}

export default LineChart
