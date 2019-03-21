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
import { Row, Col, Card, Icon, Radio, Avatar, Select, Input, Popover, Tag, Form } from 'antd';
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
import { relative } from 'upath';
import { ChartCard, Scatter, ColumnStack } from '../../components/Charts';
import { AppTopology } from '../../components/Topology';
import { Panel } from '../../components/Page';
import ApplicationLitePanel from '../../components/ApplicationLitePanel';
import DescriptionList from '../../components/DescriptionList';
import { redirect } from '../../utils/utils';
import { generateDuration } from '../../utils/time';
// import { redirect } from '../../utils/utils';
import styles from './TopologyNew.less';




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
const { Item: FormItem } = Form;
@connect(state => ({
  topology: state.topology,
  duration: state.global.duration,
  globalVariables: state.global.globalVariables,
  dashboard: state.dashboard,
  service: state.service, // service 列表
}))


@Form.create({
  mapPropsToFields(props) {
    const { variables: { values, labels } } = props.service;
    return {
      serviceId: Form.createFormField({
        value: { key: values.serviceId ? values.serviceId : '', label: labels.serviceId ? labels.serviceId : '' },
      }),
    };
  },
})

export default class Topology extends PureComponent {
  static defaultProps = {
    graphHeight: 600,
  };

  componentWillMount() {
  }

  // 获取服务列表
  componentDidMount() {
    const {...propsData} = this.props;
    propsData.dispatch({
      type: 'service/initOptions',
      payload: { variables: propsData.globalVariables },
    });
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
    console.log(variables, "poooooooooooooo in topology new")
    // return
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
    // TODO 要在panel里面传入variable变量，这个变量是来监听service Id的 [variable的值是 render里面的values]
    // 这里要根据serviceId 去获取service相关的值。比如我们要去获取表格数据 需要以来于serviceId
    this.retrieveResponseValues([variables.serviceId])
    this.retrieveResponseLinearValues(variables.serviceId)
  }

  retrieveResponseValues = (idsP) => {
    const { dispatch, globalVariables: { duration } } = this.props
    console.log("多罗罗")
    dispatch({
      type: 'topology/fetchResponseValuesMetric',
      payload: {
        variables: {
          idsP,
          duration,
        },
      },
    })
  }

  retrieveResponseLinearValues = (id) => {
    const { dispatch, globalVariables: { duration } } = this.props
    console.log("约定的梦幻岛")
    dispatch({
      type: 'topology/fetchResponseLinearMetric',
      payload: {
        variables: {
          id,
          duration,
        },
      },
    })
  }

  handleSelect = (selected) => {
    console.log(selected, "选中事件，加载的时候触发了没有------>>>>>>>>>")
    const {...propsData} = this.props;
    propsData.dispatch({
      type: 'service/saveVariables',
      payload: {
        values: { serviceId: selected.key },
        labels: { serviceId: selected.label },
      },
    });
  }

  handleLayoutChange = ({ target: { value } }) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'topology/saveData',
      payload: { layout: value },
    });
  }

  handleLoadMetrics = (ids, idsS, idsC) => {
    const { dispatch, globalVariables: { duration } } = this.props;
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

  renderSecondeChart() {
    const {...propsData} = this.props;
    const { data: { responseValueMetric } } = propsData.topology;
    const getValue = (key) => {
      return responseValueMetric[key].values.length > 0 ? responseValueMetric[key].values[0].value : 0
    }
    const chartData = [
      {
        timeConsume: "1s",
        count: getValue("s1"),
      },
      {
        timeConsume: "3s",
        count: getValue("s3"),
      },
      {
        timeConsume: "5s",
        count: getValue("s5"),
      },
      {
        timeConsume: "slow",
        count: getValue("slow"),
      },
      {
        timeConsume: "error",
        count: getValue("error"),
      },
    ]

    const cols = {
      count: {
        tickInterval: 3000,
      },
    };
    return (
      <div style={{
              border: "1px solid #e8e8e8",
              backgroundColor: "#fff",
              marginTop: "8px",
              paddingTop: "26px",
              position: "relative",
              height: "212px",
            }}
      >
        <div style={{
          position: "absolute",
          left: "10px",
          top: "7px",
          fontSize: "13px",
        }}
        > Response Summary
        </div>
        <Chart
          title="Response Time"
          padding={[ 20, 25, 50, 60]}
          height={200}
          data={chartData}
          scale={cols}
          forceFit
        >
          <Axis name="timeConsume" />
          <Axis name="count" />
          {/* <Tooltip
            crosshairs={{
                    type: "y",
                  }}
          /> */}
          <Tooltip />
          <Geom
            size="65"
            type="interval"
            color={['timeConsume', ['#D5ECD5', '#D5ECD5', '#D5ECD5', '#F98285', '#F98285']]}
            position="timeConsume*count"
          />
        </Chart>
      </div>
    )
  }

  render() {
    // console.log(this.props, "topology - new")
    const {...propsData} = this.props;
    const { data, variables: { appRegExps, appFilters = [], latencyRange } } = propsData.topology;
    const { variables: { values, options, labels } } = propsData.service;
    // console.log(values, "valuessss-----")
    const { metrics, layout = 0 } = data;
    const { getGlobalTopology: topologData, responseLinearMetric } = data;
    // console.log(data, "what the topology object data")
    const { dashboard, duration } = this.props
    const dashboardData = dashboard.data

    const thirdData = [
      {
        year: "1986",
        ACME: 162,
        Compitor: 42,
      },
      {
        year: "1987",
        ACME: 162,
        Compitor: 42,
      },
      {
        year: "1988",
        ACME: 162,
        Compitor: 42,
      },
      {
        year: "1989",
        ACME: 162,
        Compitor: 42,
      },
      {
        year: "1990",
        ACME: 162,
        Compitor: 42,
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
    // const content = (
    //   <div>
    //     <p><Tag color="#40a9ff">Less than {latencyRange[0]} ms </Tag></p>
    //     <p><Tag color="#d4b106">Between {latencyRange[0]} ms and {latencyRange[1]} ms</Tag></p>
    //     <p><Tag color="#cf1322">More than {latencyRange[1]} ms</Tag></p>
    //   </div>
    // );
    const { getFieldDecorator } = propsData.form;
    return (
      <Panel globalVariables={propsData.globalVariables} variables={values} onChange={this.handleChange}>
        <Row gutter={8}>
          <Col {...{ ...colResponsiveProps, xl: 14, lg: 14 }}>
            <div className={styles.serviceSelectInTopo}>
              <Form layout="inline">
                <FormItem>
                  {getFieldDecorator('serviceId')(
                    <Select
                      showSearch
                      optionFilterProp="children"
                      style={{ width: 200 }}
                      placeholder="Select a service"
                      labelInValue
                      onSelect={this.handleSelect.bind(this)}
                    >
                      {options.serviceId && options.serviceId.map((service) => {
                          const key = service.key || "unique"
                          return (<Option key={key} value={service.key}> {service.label}</Option>)
                        })
                      }

                    </Select>
            )}
                </FormItem>
              </Form>

            </div>
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

            {this.renderSecondeChart()}

            {/* {thirdNode} */}
            <ColumnStack dataSource={responseLinearMetric} />

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
