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


import { base } from '../utils/models';
import { exec } from '../services/graphql';

const metricQuery = `
  query TopologyMetric($duration: Duration!, $ids: [ID!]!) {
    sla: getValues(metric: {
      name: "service_sla"
      ids: $ids
    }, duration: $duration) {
      values {
        id
        value
      }
    }
    nodeCpm: getValues(metric: {
      name: "service_cpm"
      ids: $ids
    }, duration: $duration) {
      values {
        id
        value
      }
    }
    nodeLatency: getValues(metric: {
      name: "service_resp_time"
      ids: $ids
    }, duration: $duration) {
      values {
        id
        value
      }
    }
  }
`;

const serverMetricQuery = `
query TopologyServerMetric($duration: Duration!, $idsS: [ID!]!) {
  cpmS: getValues(metric: {
    name: "service_relation_server_cpm"
    ids: $idsS
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  latencyS: getValues(metric: {
    name: "service_relation_client_resp_time"
    ids: $idsS
  }, duration: $duration) {
    values {
      id
      value
    }
  }
}
`

const clientMetricQuery = `
query TopologyClientMetric($duration: Duration!, $idsC: [ID!]!) {
  cpmC: getValues(metric: {
    name: "service_relation_client_cpm"
    ids: $idsC
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  latencyC: getValues(metric: {
    name: "service_relation_client_resp_time"
    ids: $idsC
  }, duration: $duration) {
    values {
      id
      value
    }
  }
}
`

// old response metric
const speedMetricQuery = `
query SpeedMetric($duration: Duration!, $idsP: [ID!]!) {
  fastRequest: getValues(metric: {
    name: "one_second_request",
    ids: $idsP
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  mediumRequest: getValues(metric: {
    name: "three_second_request",
    ids: $idsP
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  lowRequest: getValues(metric: {
    name: "five_second_request",
    ids: $idsP
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  slowRequest: getValues(metric: {
    name: "slow_request",
    ids: $idsP
  }, duration: $duration) {
    values {
      id
      value
    }
  }
  errorRequest: getValues(metric: {
    name: "error_request",
    ids: $idsP
  }, duration: $duration) {
    values {
      id
      value
    }
  }
}
`

const responseValueMetricQuery = `
query responseMetric($duration: Duration!, $idsP: [ID!]!) {
  s1: getValues(metric: {
    name: "service_response_s1_summary",
    ids: $idsP
    }, duration: $duration) {
    values {
      id
      value
    }
  }
  s3: getValues(metric: {
    name: "service_response_s3_summary",
    ids: $idsP
    }, duration: $duration) {
    values {
      id
      value
    }
  }
  s5: getValues(metric: {
    name: "service_response_s5_summary",
    ids: $idsP
    }, duration: $duration) {
    values {
      id
      value
    }
  }
  slow: getValues(metric: {
    name: "service_response_slow_summary",
    ids: $idsP
    }, duration: $duration) {
    values {
      id
      value
    }
  }
  error: getValues(metric: {
    name: "service_response_error_summary",
    ids: $idsP
    }, duration: $duration) {
    values {
      id
      value
    }
  }
}

`

const responseLinearMetricQuery =`
query responseSecondMetric($duration: Duration!, $id: ID!)
{
  s1: getLinearIntValues(duration: $duration, metric: {name: "service_response_s1_summary", id: $id}) {
    values {
      id
      value
    }
  }
  s3: getLinearIntValues(duration: $duration, metric: {name: "service_response_s3_summary", id: $id}) {
    values {
      id
      value
    }
  }
  s5: getLinearIntValues(duration: $duration, metric: {name: "service_response_s5_summary", id: $id}) {
    values {
      id
      value
    }
  }
  slow: getLinearIntValues(duration: $duration, metric: {name: "service_response_slow_summary", id: $id}) {
    values {
      id
      value
    }
  }
  error: getLinearIntValues(duration: $duration, metric: {name: "service_response_error_summary", id: 2}) {
    values {
      id
      value
    }
  }
}

`



export default base({
  namespace: 'topology',
  state: {
    getGlobalTopology: {
      nodes: [],
      calls: [],
    },
    metrics: {
      sla: {
        values: [],
      },
      nodeCpm: {
        values: [],
      },
      nodeLatency: {
        values: [],
      },
      cpm: {
        values: [],
      },
      latency: {
        values: [],
      },
    },
    responseValueMetric: {
      error: {
        values: [],
      },
      s1: {
        values: [],
      },
      s3: {
        values: [],
      },
      s5: {
        values: [],
      },
      slow: {
        values: [],
      },
    },
    responseLinearMetric: {
      xAxisData: [],
      yAxisData: {
        error: {
          values: [],
        },
        s1: {
          values: [],
        },
        s3: {
          values: [],
        },
        s5: {
          values: [],
        },
        slow: {
          values: [],
        },
      },
      // error: {
      //   values: [],
      // },
      // s1: {
      //   values: [],
      // },
      // s3: {
      //   values: [],
      // },
      // s5: {
      //   values: [],
      // },
      // slow: {
      //   values: [],
      // },
    },
  },
  varState: {
    latencyRange: [100, 500],
  },
  dataQuery: `
    query Topology($duration: Duration!) {
      getGlobalTopology(duration: $duration) {
        nodes {
          id
          name
          type
          isReal
        }
        calls {
          id
          source
          target
          callType
          detectPoint
        }
      }
    }
  `,
  effects: {
    *fetchResponseValuesMetric({ payload }, { call, put }) {
      const { idsP, duration } = payload.variables
      const { data = {} } = yield call(exec, { query: responseValueMetricQuery, variables: { idsP, duration } })
      yield put({
        type: 'saveData',
        payload: {
          responseValueMetric: data,
        },
      });

    },
    *fetchResponseLinearMetric({ payload }, { call, put }) {
      const { id, duration } = payload.variables
      const duration1 = {
        end: "2019-03-22 1420",
        start: "2019-03-22 1405",
        step: "MINUTE",
      }
      const { data = {} } = yield call(exec, { query: responseLinearMetricQuery, variables: { id, duration: duration1 } })
      let xAxisData = []
      const yAxisData = {}
      const formatFunc = (resData) => {
        const summaryTypes = Object.keys(resData)
        const firstSummaryType = summaryTypes[0] // error s1 s3 s5 slow
        xAxisData = resData[firstSummaryType].values.map(item => {
          const{ id: key } = item
          const index = id.indexOf("_")
          return (index !== -1) ? key.subStr(0, index) : key
        })
        for (let i = 0; i < summaryTypes.length; i+=1) {
          const type = summaryTypes[i]
          yAxisData[type] = data[type].values.map(item => item.value)
        }
      }
      formatFunc(data)
      yield put({
        type: 'saveData',
        payload: {
          responseLinearMetric: {
            xAxisData,
            yAxisData,
          },
        },
      })
    },
    *fetchMetrics({ payload }, { call, put }) {
      const { ids, idsS, idsC, duration } = payload.variables;
      const { data = {} } = yield call(exec, { query: metricQuery, variables: { ids, duration } });
      let metrics = { ...data };
      if (idsS && idsS.length > 0) {
        const { data: sData = {}  } = yield call(exec, { query: serverMetricQuery, variables: { idsS, duration } });
        metrics = { ...metrics, ...sData };
      }
      if (idsC && idsC.length > 0) {
        const { data: cData = {}  } = yield call(exec, { query: clientMetricQuery, variables: { idsC, duration } });
        metrics = { ...metrics, ...cData };
      }
      // console.log(idsC, "what is this variable---------->>>>>")
      const { cpmS = { values:[] }, cpmC = { values:[] }, latencyS = { values:[] }, latencyC = { values:[] } } = metrics;
      metrics = {
        ...metrics,
        cpm: {
          values: cpmS.values.concat(cpmC.values),
        },
        latency: {
          values: latencyS.values.concat(latencyC.values),
        },
      }
      yield put({
        type: 'saveData',
        payload: {
          metrics,
        },
      });
    },
  },
  reducers: {
    filterApplication(preState, { payload: { aa } }) {
      const { variables } = preState;
      if (aa.length < 1) {
        const newVariables = { ...variables };
        delete newVariables.appRegExps;
        delete newVariables.appFilters;
        return {
          ...preState,
          variables: newVariables,
        };
      }
      return {
        ...preState,
        variables: {
          ...variables,
          appFilters: aa,
          appRegExps: aa.map((a) => {
            try {
              return new RegExp(a, 'i');
            } catch (e) {
              return null;
            }
          }),
        },
      };
    },
    setLatencyStyleRange(preState, { payload: { latencyRange } }) {
      const { variables } = preState;
      return {
        ...preState,
        variables: {
          ...variables,
          latencyRange,
        },
      };
    },
  },
});
