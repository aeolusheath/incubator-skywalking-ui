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


import { query as queryService, exec } from '../services/graphql';

export function saveOptionsInState(defaultOption, preState, { payload: allOptions }) {
  if (!allOptions) {
    return preState;
  }
  const { variables } = preState;
  const { values, labels, options } = variables;
  const amendOptions = {};
  const defaultValues = {};
  const defaultLabels = {};
  Object.keys(allOptions).forEach((_) => {
    const thisOptions = allOptions[_];
    let newOptions = [...thisOptions];
    if (defaultOption && defaultOption[_]) {
      newOptions = [defaultOption[_], ...newOptions];
    }
    if (!values[_]) {
      if (defaultOption && defaultOption[_]) {
        defaultValues[_] = defaultOption[_].key;
        defaultLabels[_] = defaultOption[_].label;
      } else if (thisOptions.length > 0) {
        defaultValues[_] = thisOptions[0].key;
        defaultLabels[_] = thisOptions[0].label;
      }
    }
    const key = values[_];
    if (!thisOptions.find(o => o.key === key)) {
      newOptions = [...newOptions, { key, label: labels[_] }];
    }
    amendOptions[_] = newOptions;
  });
  variables.options = {
    ...options,
    ...allOptions,
    ...amendOptions,
  };
  let newVariables = variables;
  if (Object.keys(defaultValues).length > 0) {
    newVariables = {
      ...variables,
      values: {
        ...values,
        ...defaultValues,
      },
      labels: {
        ...labels,
        ...defaultLabels,
      },
    };
  }
  return {
    ...preState,
    variables: newVariables,
  };
}

export function generateModal({ namespace, dataQuery, optionsQuery, defaultOption, state = {},
  varState = {}, effects = {}, reducers = {}, subscriptions = {} }) {
  return {
    namespace,
    state: {
      variables: {
        values: {},
        labels: {},
        options: {},
        ...varState,
      },
      data: state,
    },
    effects: {
      *initOptions({ payload }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(queryService, `${namespace}/options`, { variables, query: optionsQuery });
        if (reducer) {
          yield put({
            type: reducer,
            payload: response.data,
          });
        } else {
          yield put({
            type: 'saveOptions',
            payload: response.data,
          });
        }
      },
      *fetchData({ payload }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(queryService, namespace, { variables, query: dataQuery });
        if (!response.data) {
          return;
        }
        if (reducer) {
          yield put({
            type: reducer,
            payload: response.data,
          });
        } else {
          yield put({
            type: 'saveData',
            payload: response.data,
          });
        }
      },
      ...effects,
    },
    reducers: {
      saveOptions(preState, action) {
        const raw = saveOptionsInState(defaultOption, preState, action);
        return raw;
      },
      save(preState, { payload: { variables: { values = {}, options = {}, labels = {} },
        data = {} } }) {
        const { variables: { values: preValues, options: preOptions, labels: preLabels },
          data: preData } = preState;
        return {
          variables: {
            values: {
              ...preValues,
              ...values,
            },
            options: {
              ...preOptions,
              ...options,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
          data: {
            ...preData,
            ...data,
          },
        };
      },
      saveData(preState, { payload }) {
        const { data } = preState;
        return {
          ...preState,
          data: {
            ...data,
            ...payload,
          },
        };
      },
      saveVariables(preState, { payload: { values: variableValues, labels = {} } }) {
        const { variables: preVariables } = preState;
        const { values: preValues, lables: preLabels } = preVariables;
        return {
          ...preState,
          variables: {
            ...preVariables,
            values: {
              ...preValues,
              ...variableValues,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
        };
      },
      initVariables(preState, { payload: { values: variableValues, labels = {} } }) {
        const { variables: preVariables } = preState;
        return {
          ...preState,
          variables: {
            ...preVariables,
            values: {
              ...variableValues,
            },
            labels: {
              ...labels,
            },
          },
        };
      },
      ...reducers,
    },
    subscriptions: {
      ...subscriptions,
    },
  };
}

export function base({ namespace, dataQuery, optionsQuery, defaultOption, state = {},
  varState = {}, effects = {}, reducers = {}, subscriptions = {} }) {
  return {
    namespace,
    state: {
      variables: {
        values: {},
        labels: {},
        options: {},
        ...varState,
      },
      data: state,
    },
    effects: {
      *initOptions({ payload, type, serviceFilterKey }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(exec, { variables, query: optionsQuery });
        if (reducer) {
          // endpoint 的保存option走的这里
          if (reducer === 'saveServiceInfo') {
            const { env, projects } = serviceFilterKey
            const prefixes = getPrefixes(env, projects)
            const filterServiceList = getFilterServiceList(prefixes, response.data.serviceId)
            yield put({
              type: reducer,
              payload: {
                serviceId: filterServiceList,
              },
            });
          } else {
            yield put({
              type: reducer,
              payload: response.data,
            });
          }
        } else {
          const { data } = response
          // if (type === 'service/initOptions' || type === 'trace/initOptions') {
          // 'service/initOptions',
          let formatData = data
          if (['trace/initOptions', 'endpoint/initOptions', 'service/initOptions'].includes(type)) {
            const { env, projects } = serviceFilterKey
            const prefixes = getPrefixes(env, projects)
            const filterServiceList = getFilterServiceList(prefixes, data.serviceId)

            formatData = {
              serviceId: filterServiceList,
            }
            console.log("filter servicelist", data)
          }
          console.log(data, "data")
          yield put({
            type: 'saveOptions',
            payload: formatData,
          });
        }
      },
      *fetchData({ payload, type, serviceFilterKey }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(exec, { variables, query: dataQuery });
        if (!response.data) {
          return;
        }
        console.log(type, reducer, "reducer------->>>")
        if (reducer) {
          // 过滤Alerm页面的服务
          if (type === 'alarm/fetchData' && reducer === "saveServiceAlarmList") {
            yield put({
              type: reducer,
              payload: response.data,
            });
          }
          else {
            yield put({
              type: reducer,
              payload: response.data,
            });
          }
        } else {
            yield put({
              type: 'saveData',
              payload: response.data,
            });
          }
      },
      ...effects,
    },
    reducers: {
      saveOptions(preState, action) {
        const raw = saveOptionsInState(defaultOption, preState, action);
        return raw;
      },
      save(preState, { payload: { variables: { values = {}, options = {}, labels = {} },
        data = {} } }) {
        const { variables: { values: preValues, options: preOptions, labels: preLabels },
          data: preData } = preState;
        return {
          variables: {
            values: {
              ...preValues,
              ...values,
            },
            options: {
              ...preOptions,
              ...options,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
          data: {
            ...preData,
            ...data,
          },
        };
      },
      saveData(preState, { payload }) {
        const { data } = preState;
        return {
          ...preState,
          data: {
            ...data,
            ...payload,
          },
        };
      },
      saveVariables(preState, { payload: { values: variableValues, labels = {} } }) {
        const { variables: preVariables } = preState;
        const { values: preValues, lables: preLabels } = preVariables;
        return {
          ...preState,
          variables: {
            ...preVariables,
            values: {
              ...preValues,
              ...variableValues,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
        };
      },
      initVariables(preState, { payload: { values: variableValues, labels = {} } }) {
        const { variables: preVariables } = preState;
        return {
          ...preState,
          variables: {
            ...preVariables,
            values: {
              ...variableValues,
            },
            labels: {
              ...labels,
            },
          },
        };
      },
      ...reducers,
    },
    subscriptions: {
      ...subscriptions,
    },
  };
}

// 帮助方法
function getPrefixes(env, projects) {
  const prefixes = []
  projects.forEach(item => {
    prefixes.push(`${item}#`);
  });
  return prefixes
}

function getFilterServiceList(prefixes, serviceList, key = "label") {
  const list = serviceList || []
  return list.filter(item => {
     return prefixes.some(prefix => item[key].indexOf(prefix) === 0)
  })
}