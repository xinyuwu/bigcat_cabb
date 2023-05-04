import React from "react";
import * as d3 from "d3";
import * as Utils from '../util/Utils';
import * as AstroUtil from '../astro/AstroUtil';
import * as AstroSource from '../astro/AstroSource';
import * as DatetimeUtil from '../astro/DatetimeUtil';

import './SourceGraph.css'

const NO_GO_ZONE = AstroUtil.HORIZON_LIMIT;

//chart component
export default function SourceGraph(
  props: {
    utcDate: Date,
    source: any
  }) {
  // svg element
  const svgRef = React.useRef<any>();

  const [windowSize, setWindowSize] = React.useState({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  //draws chart
  React.useEffect(() => {
    draw();
  }, [windowSize, props.utcDate, props.source]);

  const drawGraph = (date: Date, 
    lstMinMax: number[], utcMinMax: number[]): {xScale: any, yScale: any} | null => {
    const margin = {
      top: 50,
      left: 50,
      right: 20,
      bottom: 50
    }

    // do not need to draw anything if it's not visiable
    // since could've got here because planned date changed on ListView
    if (!d3.select(svgRef.current).node())
      return null;

    const node = d3.select(svgRef.current).node();
    let width = node.clientWidth;
    let height = node.clientHeight;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .style('background-color', '#ECEFF1')
      .append("g")
      .attr('id', 'el_graph')
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
    
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear().rangeRound([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);

    const utcScale = d3.scaleLinear().rangeRound([0, width]);

    xScale.domain(lstMinMax);
    yScale.domain([0, 90]);
    utcScale.domain(utcMinMax);

    // gridlines in x axis function
    let make_x_gridlines = function () {
      return d3.axisBottom(xScale).ticks(24);
    }

    // gridlines in y axis function
    let make_y_gridlines = function () {
      return d3.axisLeft(yScale);
    }

    // add the X gridlines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(make_x_gridlines()
        .tickSize(-height)
        .tickFormat(() => '')
      );

    // text label for UTC axis
    let dateformat = d3.utcFormat("%d/%m/%Y");
    svg.append("text")
      .attr("transform",
        "translate(" + (width / 2) + " , -25)")
      .style("text-anchor", "middle")
      .text(dateformat(date) + ' UTC');

    // add the Y gridlines
    svg.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
        .tickSize(-width)
        .tickFormat(() => '')
      );

    // Add the X Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale).tickFormat(
        function (d) {
          let x: number = d.valueOf();
          if (x > 24)
            x = x - 24;

          return AstroUtil.hmsstring(x).slice(0, 5);
        }));

    svg.append("g")
      .attr("transform", "translate(0," + 0 + ")")
      .call(d3.axisTop(utcScale)
        .tickFormat(
          function (d) {
            let x = d.valueOf();
            while (x > 24)
              x = x - 24;

            return AstroUtil.hmsstring(x).slice(0, 5);
          }));

    svg.append("text")
      .attr("transform",
        "translate(" + (width / 2) + " , " + (height + 35) + ")")
      .style("text-anchor", "middle")
      .text('LST');

    // Add the Y Axis
    svg.append("g")
      .call(d3.axisLeft(yScale));

    // text label for the y axis
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Elevation (°)");

    // draw a dark rect from 0-limit deg no go zone
    svg.append('rect')
      .attr('x', 0)
      .attr('y', yScale(NO_GO_ZONE))
      .attr('width', width)
      .attr('height', yScale(0) - yScale(NO_GO_ZONE))
      .style('fill', '#F06292')
      .style('opacity', '0.5');

    // initialise the horizon limit 
    svg.append('line').attr('id', 'user_horizon_line');
    svg.append("text")
      .attr('id', 'user_horizon_text')
      .text('Horizon limit')
      .style("opacity", 0.5)
      .style("text-anchor", "middle");

    drawHorizonLimit(AstroUtil.HORIZON_LIMIT, yScale, width);

    return {xScale: xScale, yScale: yScale};
  }

  const drawHorizonLimit = (horizon: number, yScale: any, width: number) => {
    if (!horizon)
      horizon = 15;

    // draw a light line at give horizon for user limit
    d3.select('#user_horizon_line')
      .attr('class', 'recommended_limit')
      .attr('x1', 0)
      .attr('y1', yScale(horizon))
      .attr('x2', 0 + width)
      .attr('y2', yScale(horizon))
      .attr('stroke', 'red')
      .attr('id', 'user_horizon_line');

    d3.select('#user_horizon_text')
      .attr("transform", "translate(60, " + (yScale(horizon) - 3) + ")");
  }

  const drawSourcePath = (value: any, lstMinMax: number[], scale: any) => {

    const svg = d3.select('#el_graph');
    const line =
      d3.line()
        .x(function (d: any, i: number) {
          return scale.xScale(d.lst);
        })
        .y(function (d: any) {
          return scale.yScale(d.el);
        })
        .defined(function (d: any, i: number) {
          if (d.el < 0)
            return false;

          let lst = d.lst;
          if (lst > lstMinMax[1])
            return false;
          if (d.lst < lstMinMax[0])
            return false;

          // if (lst <= (lstMinMax[0] + 0.1) || lst >= (lstMinMax[1] - 0.1))
          //   return false;

          return true;
        })
        .curve(d3.curveBasisOpen);

    svg.append("path")
      .data([value.data.points])
      .attr('class', 'target_line')
      .attr('d', line)
      .attr('id', 'L' + value.name.replace(/[\+\-\|\.\s]/g, ''))
      .attr('stroke-width', value.stroke_width)
      .attr('stroke', value.color);
  }

  const draw = () => {
    const date = props.utcDate || new Date();
    const planDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    if (!props.source) {
      return;
    }

    const value = props.source;
    let color = Utils.COLOR_LIST[0];

    let elevations: any = AstroSource.calculateElevation(
                          { ra: value.ra, dec: value.dec }, planDate);

    let data = {
      name: value.name,
      data: elevations,
      color: color,
      stroke_width: '1px',
    };

    let minMax: number[] = [];
    minMax[0] = elevations['lstRise'];
    minMax[1] = elevations['lstSet'] > elevations['lstRise'] ? elevations['lstSet'] : elevations['lstSet'] + 24;

    let utcMinMax: number[] = [];
    let utcMin = DatetimeUtil.lst2ut(minMax[0], AstroUtil.LONGITUDE, planDate);
    let utcMax = DatetimeUtil.lst2ut(minMax[1], AstroUtil.LONGITUDE, planDate);

    if (Math.ceil(utcMax) <= Math.floor(utcMin))
      utcMax += 24;

    if (Math.ceil(utcMax) - Math.floor(utcMin) < minMax[1] - minMax[0])
      utcMax += 24;

    utcMinMax = [utcMin, utcMax];

    const scale = drawGraph(planDate, minMax, utcMinMax);

    if (scale) {
      drawSourcePath(data, minMax, scale );
    }
  }

  return (
    <svg width='100%' height='100%' ref={svgRef}>
    </svg>
  );
};