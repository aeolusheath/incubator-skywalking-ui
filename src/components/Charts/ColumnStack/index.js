import React, { Component } from 'react';

// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts';
// 引入柱状图
import  'echarts/lib/chart/bar';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';



export default class Panel extends Component {
  constructor() {
    super()
    this.myChart = null
  }

  componentDidMount() {
    this.renderChart()
  }

  componentWillUpdate() {
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
    const option = {
      tooltip : {
          trigger: 'axis',
          axisPointer : {            // 坐标轴指示器，坐标轴触发有效
              type : 'line',        // 默认为直线，可选为：'line' | 'shadow'
          },
      },
      legend: {
          // data: ['直接访问', '邮件营销','联盟广告','视频广告','搜索引擎']
      },
      grid: {
          left: 15,
          right: 15,
          top: 25,
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
      color: ["#D5ECD5", "#D5ECD5", "#D5ECD5", "#F98285", "#F98285"],
      series: [
          {
              name: '1s',
              type: 'bar',
              stack: '1s',
              data: s1,
          },
          {
              name: '3s',
              type: 'bar',
              barCategoryGap: -0.5,
              stack: '3s',
              data: s3,
          },
          {
              name: '5s',
              type: 'bar',
              stack: '5s',
              data: s5,
          },
          {
              name: 'slow',
              type: 'bar',
              stack: 'slow',
              data: slow,
          },
          {
              name: 'error',
              type: 'bar',
              stack: 'error',
              data: error,
          },
        ],
      };
    this.myChart.setOption(option)
  }

  render() {
    return (
      <div
        id="StackColumn"
        style={{
              border: "1px solid #e8e8e8",
              backgroundColor: "#fff",
              marginTop: "7px",
              height: "213px",
            }}
      >
        here
      </div>
    )
  }

}