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


import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Row, Col, Card, Icon, Radio, Avatar, Select, Input, Popover, Tag } from 'antd';
import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Coord,
  Label,
  Legend,
  View,
  Guide,
  Shape,
  Facet,
  Util,
} from "bizcharts";
import DataSet from "@antv/data-set";
import { ChartCard, Scatter } from '../../components/Charts';
import { AppTopology } from '../../components/Topology';
import { Panel } from '../../components/Page';
import ApplicationLitePanel from '../../components/ApplicationLitePanel';
import DescriptionList from '../../components/DescriptionList';
import { redirect } from '../../utils/utils';
import { generateDuration } from '../../utils/time';
// import { redirect } from '../../utils/utils';



const { Description } = DescriptionList;
const { Option } = Select;

const colResponsiveProps = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 12,
  xl: 12,
  style: { marginTop: 8 },
};

const layouts = [
  {
    name: 'dagre',
    icon: 'img/icon/dagre.png',
    rankDir: 'LR',
    minLen: 4,
    animate: true,
  },
  {
    name: 'concentric',
    icon: 'img/icon/concentric.png',
    minNodeSpacing: 10,
    animate: true,
  },
  {
    name: 'cose-bilkent',
    icon: 'img/icon/cose.png',
    idealEdgeLength: 200,
    edgeElasticity: 0.1,
    randomize: false,
  },
];

const layoutButtonStyle = { height: '90%', verticalAlign: 'middle', paddingBottom: 2 };

@connect(state => ({
  topology: state.topology,
  duration: state.global.duration,
  globalVariables: state.global.globalVariables,
  dashboard: state.dashboard,
}))
export default class Topology extends PureComponent {
  static defaultProps = {
    graphHeight: 600,
  };

  componentWillMount() {
    // this.handleRequestStatistics()
  }

  findValue = (id, values) => {
    const v = values.find(_ => _.id === id);
    if (v) {
      return v.value;
    }
    return null;
  }

  // 要将dashboard的表格数据获取进来
  // 所以在这个handleChange方法里面需要去获取dashboard的热力图数据
  handleChange = (variables) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'topology/fetchData',
      payload: { variables },
    });
    // 获取首页的热力图表格数据
    dispatch({
      type: 'dashboard/fetchData',
      payload: { variables },
    });
  }

  handleRequestStatistics = (idsP) => {
    const { dispatch,  globalVariables: { duration } } = this.props
    console.log("handleRequestStatistics", "handleRequestStatistics")
    dispatch({
      type: 'topology/fetchRequestStatistic',
      payload: {
        variables: {
          idsP: ["1"],
          duration,
        },
      },
    })
  }

  handleLayoutChange = ({ target: { value } }) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'topology/saveData',
      payload: { layout: value },
    });
  }

  handleLoadMetrics = (ids, idsS, idsC) => {
    // console.log(ids, idsS, idsC, "三组ID是什么？？？？？")
    const { dispatch, globalVariables: { duration } } = this.props;
    this.handleRequestStatistics(idsS)
    dispatch({
      type: 'topology/fetchMetrics',
      payload: { variables: {
        duration,
        ids,
        idsS,
        idsC,
      }},
    });
  }

  handleSelectedApplication = (appInfo) => {
    const { dispatch, topology: { data: { metrics: { sla, nodeCpm, nodeLatency } } } } = this.props;
    if (appInfo) {
      dispatch({
        type: 'topology/saveData',
        payload: { appInfo: { ...appInfo,
          sla: this.findValue(appInfo.id, sla.values),
          cpm: this.findValue(appInfo.id, nodeCpm.values),
          avgResponseTime: this.findValue(appInfo.id, nodeLatency.values),
        } },
      });
    } else {
      dispatch({
        type: 'topology/saveData',
        payload: { appInfo: null },
      });
    }
  }

  handleChangeLatencyStyle = (e) => {
    const { value } = e.target;
    const vArray = value.split(',');
    if (vArray.length !== 2) {
      return;
    }
    const latencyRange = vArray.map(_ => parseInt(_.trim(), 10)).filter(_ => !isNaN(_));
    if (latencyRange.length !== 2) {
      return;
    }
    const { dispatch } = this.props;
    dispatch({
      type: 'topology/setLatencyStyleRange',
      payload: { latencyRange },
    });
  }

  handleFilterApplication = (aa) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'topology/filterApplication',
      payload: { aa },
    });
  }

  renderActions = () => {
    const {...propsData} = this.props;
    const { data: { appInfo } } = propsData.topology;
    return [
      <Icon type="appstore" onClick={() => redirect(propsData.history, '/monitor/service', { key: appInfo.id, label: appInfo.name })} />,
      <Icon
        type="exception"
        onClick={() => redirect(propsData.history, '/trace',
        { values: {
            serviceId: appInfo.id,
            duration: { ...propsData.duration, input: propsData.globalVariables.duration },
          },
          labels: { applicationId: appInfo.name },
        })}
      />,
      appInfo.isAlarm ? <Icon type="bell" onClick={() => redirect(propsData.history, '/monitor/alarm')} /> : null,
    ];
  }

  renderNodeType = (topologData) => {
    const typeMap = new Map();
    topologData.nodes.forEach((_) => {
      if (typeMap.has(_.type)) {
        typeMap.set(_.type, typeMap.get(_.type) + 1);
      } else {
        typeMap.set(_.type, 1);
      }
    });
    const result = [];
    typeMap.forEach((v, k) => result.push(<Description term={k}>{v}</Description>));
    return result;
  }

  render() {
    const {...propsData} = this.props;
    const { data, variables: { appRegExps, appFilters = [], latencyRange } } = propsData.topology;
    const { metrics, layout = 0 } = data;
    const { getGlobalTopology: topologData } = data;
    // console.log(data.topologData, "what the dasboard object data")
    const { dashboard, duration } = this.props
    const dashboardData = dashboard.data
    const secondData = [
      {
        year: "1s",
        sales: 38,
      },
      {
        year: "3s",
        sales: 52,
      },
      {
        year: "5s",
        sales: 4,
      },
      {
        year: "Slow",
        sales: 2,
      },
      {
        year: "Error",
        sales: 10,
      },
    ];
    const secondCols = {
      sales: {
        tickInterval: 20,
      },
    };
    const thirdData = [
      {
        year: "1986",
        ACME: 162,
        Compitor: 42,
      },
      {
        year: "1987",
        ACME: 134,
        Compitor: 54,
      },
      {
        year: "1988",
        ACME: 116,
        Compitor: 26,
      },
      {
        year: "1989",
        ACME: 122,
        Compitor: 32,
      },
      {
        year: "1990",
        ACME: 178,
        Compitor: 68,
      },
      {
        year: "1991",
        ACME: 144,
        Compitor: 54,
      },
      {
        year: "1992",
        ACME: 125,
        Compitor: 35,
      },
    ];
    const thirdDv = new DataSet.View().source(thirdData);
    thirdDv.transform({
      type: "fold",
      fields: ["ACME", "Compitor"],
      key: "type",
      value: "value",
    });
    const thirdScale = {
      value: {
        alias: "The Share Price in Dollars",
        formatter(val) {
          return `$${  val}`;
        },
      },
      year: {
        range: [0, 1],
      },
    };
    const thirdNode = (
      <div
        style={{
              border: "1px solid #e8e8e8",
              backgroundColor: "#fff",
              marginTop: "7px",
              height: "213px",
            }}
      >
        <Chart
          height={200}
          data={thirdDv}
          scale={thirdScale}
          forceFit
          padding={[ 20, 30, 20, 50]}

        >
          <Tooltip crosshairs />
          <Axis />
          <Geom type="area" position="year*value" color="type" shape="smooth" />
          <Geom
            type="line"
            position="year*value"
            color="type"
            shape="smooth"
            size={2}
          />
        </Chart>
      </div>


    );




    // console.log(dashboardData, "abcdefg")
    // console.log(duration, "duration----->>>>>>")
    const content = (
      <div>
        <p><Tag color="#40a9ff">Less than {latencyRange[0]} ms </Tag></p>
        <p><Tag color="#d4b106">Between {latencyRange[0]} ms and {latencyRange[1]} ms</Tag></p>
        <p><Tag color="#cf1322">More than {latencyRange[1]} ms</Tag></p>
      </div>
    );
    return (
      <Panel globalVariables={propsData.globalVariables} onChange={this.handleChange}>
        <Row gutter={8}>
          <Col {...{ ...colResponsiveProps, xl: 14, lg: 14 }}>
            <ChartCard
              title="Topology Map"
              avatar={<Avatar icon="fork" style={{ color: '#1890ff', backgroundColor: '#ffffff' }} />}
              action={(
                <Radio.Group value={layout} onChange={this.handleLayoutChange} size="normal">
                  {layouts.map((_, i) => (
                    <Radio.Button value={i} key={_.name}>
                      <img src={_.icon} alt={_.name} style={layoutButtonStyle} />
                    </Radio.Button>
))}
                </Radio.Group>
              )}
            >
              {topologData.nodes.length > 0 ? (
                <AppTopology
                  height={propsData.graphHeight}
                  elements={topologData}
                  metrics={metrics}
                  onSelectedApplication={this.handleSelectedApplication}
                  onLoadMetircs={this.handleLoadMetrics}
                  layout={layouts[layout]}
                  latencyRange={latencyRange}
                  appRegExps={appRegExps}
                />
              ) : null}
            </ChartCard>
          </Col>
          <Col {...{ ...colResponsiveProps, xl: 10, lg: 10 }}>
            <ChartCard
              contentHeight={200}
              hasChartTop={false}
              chartBodyStyle={{
                padding: 0,
                paddingTop: "10px",
                paddingBottom: "10px",
              }}
            >
              <Scatter
                data={dashboardData.getThermodynamic}
                duration={duration}
                height={200}
                onClick={(d, responseTimeRange) => redirect(history, '/trace', { values: { duration: generateDuration({
                  from() {
                    return d.start;
                  },
                  to() {
                    return d.end;
                  },
                }),
                minTraceDuration: responseTimeRange.min,
                maxTraceDuration: responseTimeRange.max,
              } })}
              />
            </ChartCard>



            <div style={{
              border: "1px solid #e8e8e8",
              backgroundColor: "#fff",
              marginTop: "8px",
              paddingTop: "15px",
              height: "212px",
            }}
            >
              <Chart
                padding={[ 20, 25, 50, 60]}
                height={200}
                data={secondData}
                scale={secondCols}
                forceFit
              >
                <Axis name="year" />
                <Axis name="sales" />
                <Tooltip
                  crosshairs={{
                    type: "y",
                  }}
                />
                <Geom
                  type="interval"
                  color={['year', ['#D5ECD5', '#D5ECD5', '#D5ECD5', '#F98285', '#F98285']]}
                  position="year*sales"
                />
              </Chart>
            </div>

            {thirdNode}

            {/* {data.appInfo ? (
              <Card
                title={data.appInfo.name}
                bodyStyle={{ height: 568 }}
                actions={this.renderActions()}
              >
                <ApplicationLitePanel appInfo={data.appInfo} />
              </Card>
            )
            : (
              <Card title="Overview" style={{ height: 672 }}>
                <Select
                  mode="tags"
                  style={{ width: '100%', marginBottom: 20 }}
                  placeholder="Filter application"
                  onChange={this.handleFilterApplication}
                  tokenSeparators={[',']}
                  value={appFilters}
                >
                  {data.getGlobalTopology.nodes.filter(_ => _.isReal)
                    .map(_ => <Option key={_.name}>{_.name}</Option>)}
                </Select>
                <Popover content={content} title="Info">
                  <h4>Latency coloring thresholds  <Icon type="info-circle-o" /></h4>
                </Popover>
                <Input style={{ width: '100%', marginBottom: 20 }} onChange={this.handleChangeLatencyStyle} value={latencyRange.join(',')} />
                <h4>Overview</h4>
                <DescriptionList layout="vertical">
                  <Description term="Total">{topologData.nodes.length}</Description>
                  {this.renderNodeType(topologData)}
                </DescriptionList>
              </Card>
            )} */}
          </Col>
        </Row>
      </Panel>
    );
  }
}
