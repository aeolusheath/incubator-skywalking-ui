/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react';
import { Chart, Axis, Tooltip, Geom } from 'bizcharts';
import Brush from "@antv/g2-brush";
// import Brush from "@antv/g2-brush";
import { merge } from 'rxjs';
import autoHeight from '../autoHeight';
import styles from '../index.less';
import { redirect } from '../../../utils/utils';
import { generateDuration } from '../../../utils/time';


const yTickOffset = 20;
let chart
let brush
@autoHeight()
class HeatMap extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.bindBrush("componentDidMount")
  }

  shouldComponentUpdate(nextProps) {
    // const {...propsData} = this.props;
    // const { globalVariables, variables, onChange } = nextProps;
    // if (!this.isRender(nextProps)) {
    //   return false;
    // }
    // if (globalVariables !== propsData.globalVariables || variables !== propsData.variables) {
    //   onChange({ ...globalVariables, ...variables });
    //   return false;
    // }
    // return true;

    const { ...propsData } = this.props
    const { data, duration } = nextProps
    if (data !== propsData.data || duration !== propsData.duration) {
      return true
    }
    return false
  }

  componentDidUpdate() {
      this.bindBrush("componentDidUpdate")
  }



  getScaleMap = maxResponseTimeOffset => {
    const scaleMap = [];
    const remainder = (maxResponseTimeOffset + 1) % (yTickOffset + 1);
    const times = ~~((maxResponseTimeOffset + 1) / (yTickOffset + 1));
    if (remainder > 0) {
      scaleMap.push([0, remainder - 1, times + 1]);
      scaleMap.push([remainder, yTickOffset, times]);
    } else {
      scaleMap.push([0, yTickOffset, times]);
    }
    return scaleMap;
  };

  reduceData = (scaleMap, reducer, init = 0) => {
    const result = [];
    for (let i = 0; i < scaleMap.length; i += 1) {
      const scale = scaleMap[i];
      for (let j = scale[0]; j <= scale[1]; j += 1) {
        let item = init;
        for (let k = 0; k < scale[2]; k += 1) {
          item = reducer(item, k);
        }
        result.push(item);
      }
    }
    return result;
  };

  mapXAxisData = (reducedData, datetime) =>
    reducedData.map((count, i) => ({ datetime, responseTime: i, count }));

  handlePlotClick = (dtStart, dtEnd, responseTime) => {
    const {...propsData} = this.props
    const removedUnit = responseTime.slice(0, responseTime.indexOf('ms'));
    let min;
    let max;
    if (removedUnit.indexOf('>') === 0) {
      min = parseInt(removedUnit.slice(1), 10);
    } else {
      const value = parseInt(removedUnit, 10);
      min = value - 100 < 0 ? 0 : value - 100;
      max = value;
    }
    propsData.onClick({ start: dtStart, end: dtEnd }, { min, max });
  };

  redirectToTracePage (start, end, minDuration, maxDuratoin) {
    const { history, serviceId } = this.props;
    const postObj = { duration: generateDuration({
        from() {
          return start;
        },
        to() {
          return end;
        },
      }),
      serviceId,
      minTraceDuration: minDuration,
      maxTraceDuration: maxDuratoin,
    }
    if (minDuration === 0) {
      delete postObj.minTraceDuration
    }
    if (maxDuratoin === 0) {
      delete postObj.maxTraceDuration
    }
    redirect(history, '/trace', { values: postObj })

  }

  bindBrush () {
    const that = this
    if(chart) {
      if (brush) {
        brush.destroy()
      }
      brush = new Brush({
        canvas: chart.get("canvas"),
        chart,
        onBrushend(ev, p2, p3, p4, p5) {
          const { data } = ev
          const xAxisArr = []
          const durationList = []
          data.forEach(item => {
            xAxisArr.push(item.datetime)
            durationList.push(item.responseTime)
          })
          xAxisArr.sort((a, b) => a - b)
          durationList.sort((a, b) => a - b)
          const { data: { responseTimeStep } } = that.props
          const { responseTimeAxis: yLength } = that.state
          const minDuration = durationList[0] * responseTimeStep * 2
          let maxDuration = (durationList[durationList.length - 1] + 1) * responseTimeStep * 2
          if (durationList[durationList.length - 1] === (yLength - 1)) {
            maxDuration = 0
          }
          // 获取到xAxisArr的最大值 最小值
          if(xAxisArr.length !== 0) {
            const { duration: { raw: { range: timeRange } } } = that.props
            const endIndex = xAxisArr[xAxisArr.length - 1]
            const startIndex = xAxisArr[0]
            const start = timeRange[startIndex]
            const end = timeRange[endIndex]
            that.redirectToTracePage(start, end, minDuration, maxDuration)
          }
        },
      })
    }
  }

  render() {
    const {
      height,
      data: { nodes, responseTimeStep },
      duration,
    } = this.props;

    if (!nodes || nodes.length < 1) {
      return <span style={{ display: 'none' }} />;
    }
    const {
      display: { range },
      raw: { range: rawRange },
    } = duration;
    const source = [];
    let maxResponseTimeOffset = 0;
    for (let i = 0; i < nodes.length; i += 1) {
      const item = nodes[i];
      if (item[0] >= range.length) {
        break;
      }
      maxResponseTimeOffset = maxResponseTimeOffset > item[1] ? maxResponseTimeOffset : item[1];
      source.push({
        datetime: item[0],
        responseTime: item[1],
        count: item[2],
      });
    }
    let mergeSource = [];
    let responseTimeAxis = [];
    if (maxResponseTimeOffset > yTickOffset) {
      const scaleMap = this.getScaleMap(maxResponseTimeOffset);
      let data = 0;
      const xAxisStepArray = this.reduceData(scaleMap, time => time + responseTimeStep);
      responseTimeAxis = xAxisStepArray.map((_, i) => {
        data += _;
        return `${i === xAxisStepArray.length - 1 ? '>' : ''}${
          i === xAxisStepArray.length - 1 ? data - _ : data
        }ms`;
      });
      let datetime = 0;
      while (source.length > 0) {
        const reducedData = this.reduceData(scaleMap, count => {
          const item = source.shift();
          return item ? item.count + count : count;
        });
        mergeSource.push(...this.mapXAxisData(reducedData, datetime));
        datetime += 1;
      }
    } else {
      for (let i = 0; i < maxResponseTimeOffset + 1; i += 1) {
        responseTimeAxis.push(
          `${
            i === maxResponseTimeOffset ? `>${i * responseTimeStep}` : (i + 1) * responseTimeStep
          }ms`
        );
      }
      mergeSource.push(...source);
    }
    // 配置 x 轴  和 y 轴
    const cols = {
      datetime: {
        type: 'cat',
        values: range,
        tickCount: 5,
      },
      responseTime: {
        type: 'cat',
        values: responseTimeAxis,
        tickCount: 5,
      },
    };

    this.setState({
      responseTimeAxis: cols.responseTime.values.length,
    })
    // this.state.responseTimeAxis = cols.responseTime.values.length
    mergeSource = mergeSource.filter(item => item.count !== 0)
    return (
      <div className={styles.chart} style={{ height }}>
        <div>
          {/* <Chart
            onGetG2Instance={g2Chart => {
              chart = g2Chart;
            }}
            data={mergeSource}
            scale={cols}
            forceFit
            height={height * 1.4}
            onPlotClick={({
              data: {
                _origin: { datetime, responseTime },
              },
            }) =>
              this.handlePlotClick(
                rawRange[datetime],
                rawRange[datetime + 1],
                responseTimeAxis[responseTime]
              )
            }
          > */}
          <Chart
            onGetG2Instance={g2Chart => {
              chart = g2Chart;
            }}
            data={mergeSource}
            scale={cols}
            forceFit
            height={height * 1.4}
            // padding={{left: 50}}
            // onPlotClick={() =>{}}
            onPlotClick={(param) => {
              // console.log("param------->>>>>>>>>abcdefg", param)
              }
            }
          >
            <Axis
              name="datetime"
              grid={{
                align: 'center',
                lineStyle: {
                  lineWidth: 1,
                  lineDash: null,
                  stroke: '#f0f0f0',
                },
                showFirstLine: true,
              }}
            />
            <Axis
              name="responseTime"
              grid={{
                align: 'center',
                lineStyle: {
                  lineWidth: 1,
                  lineDash: null,
                  stroke: '#f0f0f0',
                },
              }}
            />
            <Tooltip />
            <Geom
              // type="polygon"
              type="point"
              shape="circle"
              position="datetime*responseTime"
              color={['count', '#EBEDF0-#BAE7FF-#1890FF-#0050B3']}
              style={{ stroke: '#fff', lineWidth: 1 }}
              size={2.5}
              tooltip={[
                'datetime*responseTime*count',
                (datetime, responseTime, count) => {
                  return {
                    name: range[datetime],
                    title: `${responseTime > 0 ? responseTimeAxis[responseTime - 1] : 0}~${
                      responseTimeAxis[responseTime]
                    }`,
                    value: count,
                  };
                },
              ]}
            />
          </Chart>
        </div>
      </div>
    );
  }
}

export default HeatMap;
