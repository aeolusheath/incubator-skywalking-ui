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
import { Row, Col, Card, Tag } from 'antd';
import classNames from 'classnames';
import {
  ChartCard, MiniBar, Line, Area, StackBar,
} from '../../components/Charts';
import DescriptionList from '../../components/DescriptionList';
import { axis } from '../../utils/time';
import { avgTimeSeries } from '../../utils/utils';
import ControlPanel from '../../components/ControlPanel';


const { Description } = DescriptionList;


export default class Server extends PureComponent {
  bytesToMB = list => list.map(_ => parseFloat((_ / (1024 ** 2)).toFixed(2)))
  render() {
    const { duration, data } = this.props;
    const { serverInfo, getServerResponseTimeTrend, getServerThroughputTrend,
      getCPUTrend, getMemoryTrend, getGCTrend } = data;
    return (
      <div>
        <ControlPanel className="mt-sm" style={{ marginTop: 15 }} />
        <Row gutter={8}>
          {/* <Col xs={24} sm={24} md={24} lg={6} xl={6} style={{ marginTop: 8 }}>
            <Card style={{ marginTop: 8 }} bordered={false}>
              <DescriptionList col={1} layout="horizontal" >
                <Description term="Host">{serverInfo.host}</Description>
                <Description term="IPv4">{serverInfo.ipv4 ? serverInfo.ipv4.join() : ''}
                </Description>
                <Description term="Pid">{serverInfo.pid}</Description>
                <Description term="OS">{serverInfo.osName}</Description>
              </DescriptionList>
            </Card>
          </Col> */}
          <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ marginTop: 8 }}>
            <Row gutter={8}>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} style={{ marginTop: 8 }}>
                <Card>
                  <DescriptionList col={1} layout="horizontal" >
                    <Description term="Host">{serverInfo.host}</Description>
                    <Description term="IPv4">{serverInfo.ipv4 ? serverInfo.ipv4.join() : ''}</Description>
                    <Description term="Pid">{serverInfo.pid}</Description>
                    <Description term="OS">{serverInfo.osName}</Description>
                  </DescriptionList>
                </Card>
              </Col>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} style={{ marginTop: 8 }}>
                <ChartCard
                  isSetContentFixedHeight
                  style={{ height: 186 }}
                  title={<span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>平均流量(Avg Throughput)</span>}
                  // total={`${avgTimeSeries(getServerThroughputTrend.trendList)} cpm`}
                  contentHeight={126}
                >
                  <div className="leftTextContainer" >
                    <span className={classNames('db', 'data')}>{`${avgTimeSeries(getServerThroughputTrend.trendList)}`} </span>
                    <span className={classNames('db', 'unit')}> cpm</span>
                  </div>
                  <div className="pull-right" style={{ width: 'calc(100% - 107px)' }}>
                    <MiniBar
                      // color="#975FE4"
                      data={axis(duration, getServerThroughputTrend.trendList)}
                    />
                  </div>
                </ChartCard>
              </Col>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} style={{ marginTop: 8 }}>
                <ChartCard
                  isSetContentFixedHeight
                  style={{ height: 186 }}
                  title={<span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>平均耗时(Avg Response Time)</span>}
                  // total={`${avgTimeSeries(getServerResponseTimeTrend.trendList)} ms`}
                  contentHeight={126}
                >
                  {getServerResponseTimeTrend.trendList.length > 0 ? (

                    <div style={{ width: '100%', height: '100%' }} className="clearfix">
                      <div className="leftTextContainer" >
                        <span className={classNames('db', 'data')}>{`${avgTimeSeries(getServerResponseTimeTrend.trendList)}`} </span>
                        <span className={classNames('db', 'unit')}> ms</span>
                      </div>
                      <div className="pull-right" style={{ width: 'calc(100% - 107px)' }}>
                        <MiniBar
                          data={axis(duration, getServerResponseTimeTrend.trendList)}
                        />
                      </div>
                    </div>
                  ) : (<span style={{ display: 'none' }} />)}
                </ChartCard>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={24} style={{ marginTop: 8 }}>
                <ChartCard
                  title="CPU %"
                  contentHeight={150}
                >
                  <Line
                    data={axis(duration, getCPUTrend.cost)}
                  />
                </ChartCard>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={24} style={{ marginTop: 8 }}>
                <ChartCard
                  title="Heap MB"
                  contentHeight={150}
                >
                  <Area
                    data={axis(duration, this.bytesToMB(getMemoryTrend.heap), ({ x, y }) => ({ x, y, type: 'value' }))
                      .concat(axis(duration, this.bytesToMB(getMemoryTrend.maxHeap), ({ x, y }) => ({ x, y, type: 'free' })))}
                  />
                </ChartCard>
              </Col>
              <Col span={24} style={{ marginTop: 8 }}>
                <ChartCard
                  title="Non-Heap MB"
                  contentHeight={150}
                >
                  <Area
                    data={axis(duration, this.bytesToMB(getMemoryTrend.noheap), ({ x, y }) => ({ x, y, type: 'value' }))
                    .concat(axis(duration, this.bytesToMB(getMemoryTrend.maxNoheap), ({ x, y }) => ({ x, y, type: 'free' })))}
                  />
                </ChartCard>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={24} style={{ marginTop: 8 }}>
                <ChartCard
                  title="GC ms"
                  contentHeight={150}
                  footer={
                    <div style={{ display: 'flex', justifyContent: 'center' }} className="mt-sm">
                      <div style={{ marginBottom: 10, display: 'inline-block' }}>
                        <span style={{ marginRight: 10 }}>Young GC</span>
                        <Tag color="#66b5ff" >
                          {getGCTrend.youngGCCount.reduce((sum, v) => sum + v)}
                        </Tag>
                        <span>collections</span>
                      </div>
                      <div style={{ display: 'inline-block' }}>
                        <span style={{ marginRight: 10 }}>Old GC</span>
                        <Tag color="#ffb566" >
                          {getGCTrend.oldGCount.reduce((sum, v) => sum + v)}
                        </Tag>
                        <span>collections</span>
                      </div>
                    </div>
                  }
                >
                  <StackBar
                    data={axis(duration, getGCTrend.youngGCTime, ({ x, y }) => ({ x, y, type: 'youngGCTime' }))
                    .concat(axis(duration, getGCTrend.oldGCTime, ({ x, y }) => ({ x, y, type: 'oldGCTime' })))}
                  />
                </ChartCard>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}
