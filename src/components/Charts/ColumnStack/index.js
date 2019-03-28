import React, { Component } from 'react';

// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts';
// 引入柱状图
import  'echarts/lib/chart/bar';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend'



export default class Panel extends Component {
  constructor() {
    super()
    this.myChart = null
  }

  componentDidMount() {
    // this.renderChart()
    // 在componentDidUpdate里面一定会去渲染
  }

  shouldComponentUpdate(nextProps) {
    const {...propsData} = this.props;
    const { dataSource } = nextProps;
    if (dataSource === propsData.dataSource) {
      return false
    }
    return true;
  }

  componentDidUpdate() {
    this.renderChart()

  }

  renderChart() {
    const { dataSource } = this.props
    const { xAxisData, yAxisData: {s1, s3, s5, slow, error } } = dataSource


    if(this.myChart) {
      this.myChart.clear()
      this.myChart = null
    }

    this.myChart = echarts.init(document.getElementById('StackColumn'));
    // color={['timeConsume', ['#56B356', '#639AFB', '#D5ECD5', '#F98285', '#F98285']]}
      // color: ["#D5ECD5", "lightskyblue", "#F9D25A", "#f1b26f", "#F98285"],
    const keyColor = {
      '1s': '#D5ECD5',
      '3s': 'lightskyblue',
      '5s': '#F9D25A',
      'slow': '#f1b26f',
      'error': '#F98285',
    }

    // mock真实的数据
    const option = {
      tooltip : {
          backgroundColor: 'white',
          trigger: 'axis',
          axisPointer : {            // 坐标轴指示器，坐标轴触发有效
              type : 'line',        // 默认为直线，可选为：'line' | 'shadow'
          },
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 11,
            fontWeight: 'normal',
            lineHeight: 60,
            paddingTop: 5,
          },
          extraCssText: `
            width: 105px;
            box-shadow: 0 0 3px .4px rgba(0, 0, 0, 0.2);
            padding-bottom: 10px;
            padding-top: 10px;
            padding-left: 12px;
          `,
          formatter (params) {
              const { axisValue } = params[0]
              const keys = ['1s', '3s', '5s', 'slow', 'error']
              const mapObj = {}
              const getFormatData = (key, str, value) => {
                if(str.includes(key)) {
                  mapObj[key] = value
                }
              }
              params.reverse().forEach(item => {
                const  { seriesId } = item
                keys.forEach(key => {
                  getFormatData(key, seriesId, item.value)
                })
              })
              let htmlTemplate = ''
              for(const key in mapObj) {
                if(Object.prototype.hasOwnProperty.call(mapObj, key)) {
                  htmlTemplate += `
                    <div style="
                        margin-top: 4px;
                      ">
                      <span
                        style="
                          display: inline-block;
                          height: 5px;
                          width: 5px;
                          border-radius: 50%;
                          background-color: ${keyColor[key]};
                          margin-right: 5px;
                      ">  </span>
                      <span> ${key}:  </span>
                      <span> &nbsp; ${mapObj[key]} </span>
                    </div>`
                }
              }
              return`
               ${axisValue}<br>
               ${htmlTemplate}
              `
          },

      },
      legend: {
        data: ['1s', '3s', '5s', 'slow', 'error'],
        top: 3,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: 'rgba(0, 0, 0, 0.65)',
        },
      },
      grid: {
          left: 15,
          right: 15,
          top: 40,
          bottom: 15,
          // bottom: '3%',
          containLabel: true,
      },
      xAxis:  {
          type: 'category',
          // data: ['1s','2s','3s','5s','slow','error'],
          data: xAxisData,
          axisLine: {
            lineStyle: {
                type: 'solid',
                color: "#ddd", // 左边线的颜色
                width:'1', // 坐标线的宽度
            },
          },
          axisLabel: {
              textStyle: {
                  color: 'rgba(0, 0, 0, 0.65)',// 坐标值得具体的颜色
              },
          },
      },
      yAxis: {
          type: 'value',
          nameGap: 30,
          axisLine: {
            lineStyle: {
                type: 'solid',
                color: "rgba(0, 0, 0, 0.2)", // 左边线的颜色
                width:'0', // 坐标线的宽度
            },
          },
          axisLabel: {
              textStyle: {
                  color: 'rgba(0, 0, 0, 0.65)',// 坐标值得具体的颜色
              },
          },
      },
      // color: ["#D5ECD5", "#D5ECD5", "#D5ECD5", "#F98285", "#F98285"],
      // color: ["#D5ECD5", "#639AFB", "#F9D25A", "#F8A750", "#F98285"],
      color: ["#D5ECD5", "lightskyblue", "#F9D25A", "#f1b26f", "#F98285"],
      series: [
          {
              name: '1s',
              type: 'bar',
              stack: 'total',
              data: s1,
          },
          {
              name: '3s',
              type: 'bar',
              barCategoryGap: -0.5,
              stack: 'total',
              data: s3,
          },
          {
              name: '5s',
              type: 'bar',
              stack: 'total',
              data: s5,
          },
          {
              name: 'slow',
              type: 'bar',
              stack: 'total',
              data: slow,
          },
          {
              name: 'error',
              type: 'bar',
              stack: 'total',
              data: error,
          },
        ],
    };

    // const generateSixRandomNum = (min, max) => {
    //   return []
    // }

    // 假数据
    // const option = {
    //   tooltip : {
    //       backgroundColor: 'white',
    //       trigger: 'axis',
    //       axisPointer : {            // 坐标轴指示器，坐标轴触发有效
    //           type : 'line',        // 默认为直线，可选为：'line' | 'shadow'
    //       },
    //       textStyle: {
    //         color: 'rgba(0, 0, 0, 0.65)',
    //         fontSize: 11,
    //         fontWeight: 'normal',
    //         lineHeight: 60,
    //         paddingTop: 5,
    //       },
    //       extraCssText: `
    //         width: 105px;
    //         box-shadow: 0 0 3px .4px rgba(0, 0, 0, 0.2);
    //         padding-bottom: 10px;
    //         padding-top: 10px;
    //         padding-left: 12px;
    //       `,
    //       formatter (params) {
    //           const { axisValue } = params[0]
    //           const keys = ['1s', '3s', '5s', 'slow', 'error']
    //           const mapObj = {}
    //           const getFormatData = (key, str, value) => {
    //             if(str.includes(key)) {
    //               mapObj[key] = value
    //             }
    //           }
    //           params.reverse().forEach(item => {
    //             const  { seriesId } = item
    //             keys.forEach(key => {
    //               getFormatData(key, seriesId, item.value)
    //             })
    //           })
    //           let htmlTemplate = ''
    //           for(const key in mapObj) {
    //             if(Object.prototype.hasOwnProperty.call(mapObj, key)) {
    //               htmlTemplate += `
    //                 <div style="
    //                     margin-top: 4px;
    //                   ">
    //                   <span
    //                     style="
    //                       display: inline-block;
    //                       height: 5px;
    //                       width: 5px;
    //                       border-radius: 50%;
    //                       background-color: ${keyColor[key]};
    //                       margin-right: 5px;
    //                   ">  </span>
    //                   <span> ${key}:  </span>
    //                   <span> &nbsp; ${mapObj[key]} </span>
    //                 </div>`
    //             }
    //           }
    //           return`
    //            ${axisValue}<br>
    //            ${htmlTemplate}
    //           `
    //       },

    //   },
    //   legend: {
    //       // data: ['直接访问', '邮件营销','联盟广告','视频广告','搜索引擎']
    //   },
    //   grid: {
    //       left: 15,
    //       right: 15,
    //       top: 25,
    //       bottom: 15,
    //       // bottom: '3%',
    //       containLabel: true,
    //   },
    //   xAxis:  {
    //       type: 'category',
    //       // data: ['1s','2s','3s','5s','slow','error'],
    //       data: ["14:14:00", "14:15:00", "14:16:00", "14:17:00", "14:18:00", "14:19:00"],
    //       axisLine: {
    //         lineStyle: {
    //             type: 'solid',
    //             color: "#ddd", // 左边线的颜色
    //             width:'1', // 坐标线的宽度
    //         },
    //       },
    //       axisLabel: {
    //           textStyle: {
    //               color: 'rgba(0, 0, 0, 0.65)',// 坐标值得具体的颜色
    //           },
    //       },
    //   },
    //   yAxis: {
    //       type: 'value',
    //       nameGap: 30,
    //       axisLine: {
    //         lineStyle: {
    //             type: 'solid',
    //             color: "rgba(0, 0, 0, 0.2)", // 左边线的颜色
    //             width:'0', // 坐标线的宽度
    //         },
    //       },
    //       axisLabel: {
    //           textStyle: {
    //               color: 'rgba(0, 0, 0, 0.65)',// 坐标值得具体的颜色
    //           },
    //       },
    //   },
    //   color: ["#D5ECD5", "#D5ECD5", "#D5ECD5", "#F98285", "#F98285"],
    //   series: [
    //       {
    //           name: '1s',
    //           type: 'bar',
    //           stack: 'total',
    //           data: [320, 302, 301, 334, 390, 330],
    //       },
    //       {
    //           name: '3s',
    //           type: 'bar',
    //           barCategoryGap: -0.5,
    //           stack: 'total',
    //           data: [120, 132, 101, 134, 90, 230],
    //       },
    //       {
    //           name: '5s',
    //           type: 'bar',
    //           stack: 'total',
    //           data: [220, 182, 191, 234, 290, 330],
    //       },
    //       {
    //           name: 'slow',
    //           type: 'bar',
    //           stack: 'total',
    //           data: [150, 212, 201, 154, 190, 330],
    //       },
    //       {
    //           name: 'error',
    //           type: 'bar',
    //           stack: 'total',
    //           data: [820, 832, 901, 934, 1290, 1330],
    //       },
    //     ],
    // };
    this.myChart.setOption(option)
  }

  render() {
    return (
      <div style={{
        position: "relative",
        width: "100%",
      }}
      >
        <div
          id="StackColumn"
          style={{
              border: "1px solid #e8e8e8",
              backgroundColor: "#fff",
              marginTop: "7px",
              height: "224px",
              paddingTop: "9px",
              position: "relatives",
            }}
        />
        <span
          style={{
          position: "absolute",
          left: "15px",
          top: "4px",
         }}
        >load
        </span>
      </div>
    )
  }

}