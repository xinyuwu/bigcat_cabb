import React from "react";
import * as d3 from "d3";
import * as ATCAConstants from '../util/ATCAConstants'

import './SubBandView.css'
import Snackbar from "@mui/material/Snackbar";


//chart component
export default function SubBandView(
  props: {
    subBandConfigs: any[],
    setSubBandConfigs: (config: any) => void,
    corrMode: any,
    corrConfig: any
  })
{
  const [openSnack, setOpenSnack] = React.useState(false);

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
  }, [windowSize, props.subBandConfigs]);

  const draw = (): void => {
    const margin = {
      top: 30,
      left: 0,
      right: 0,
      bottom: 10
    }

    const gap_between_bands = 20

    // do not need to draw anything if it's not visiable
    // since could've got here because planned date changed on ListView
    if (!d3.select(svgRef.current).node())
      return;

    const node = d3.select(svgRef.current).node();
    let width = node.clientWidth;
    let height = node.clientHeight;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .style('background-color', 'white')
      .append("g")
      .attr('id', 'subband-grid')
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    const num_of_if = ATCAConstants.NUMBER_OF_IF;
    const num_of_sub_bands = ATCAConstants.SUB_BANDS_PER_IF;
    const bandWidth = (width - (num_of_if - 1) * gap_between_bands) / num_of_if;
    const xScale = d3.scaleLinear().rangeRound([0, bandWidth]);
    xScale.domain([0, num_of_sub_bands]);

    const subBandWidth = xScale(2) - xScale(1);

    // frequency scale
    const zoomScale = d3.scaleLinear().rangeRound([0, subBandWidth]);
    zoomScale.domain([0, 5]);

    const myData: any[] = [];
    for (let i = 1; i <= num_of_if; i++) {
      const subBands: any[] = [];

      for (let j = 1; j <= num_of_sub_bands; j++) {
        const data = {
          band: i,
          subband: j,
          start_freq: ATCAConstants.getStartFreq(props.corrMode, i, j),
          end_freq: ATCAConstants.getEndFreq(props.corrMode, i, j)
        };
        subBands.push(data);
      }
      myData.push(subBands);
    }

    // draw sub bands axis text
    svg.append("g").selectAll("g")
      .data(myData)
      .enter().append("g")
      .attr("transform", function (d, i) {
        return "translate(" + i * (bandWidth + gap_between_bands) + ")"
      })
      .selectAll("text")
      .data(function (d: any) {
        return d;
      })
      .enter()
      .append("text")
      .text((d:any, i) => {
        if (d.subband === 5)
          return '05';
        else if (d.subband % 5 === 0)
          return '' + d.subband;
        else
          return '';
      })
      .attr("x", (d:any, i) => { return xScale(i) + subBandWidth/4; })
      .attr("y", height + 10)
      .style("font-size", "10px");

    svg.append("text")
      .attr('id', 'sub_band_text')
      .text('')
      .style("text-anchor", "start")
      .attr("x", 10)
      .attr("y", -8);

    // draw sub band
    svg.append("g").selectAll("g")
      .data(myData)
      .enter().append("g")
      .attr("transform", function (d, i) {
        return "translate(" + i * (bandWidth + gap_between_bands) + ")"
      })
      .selectAll("rect")
      .data(function (d: any) { 
        return d; 
      })
      .enter().append("rect")
      .attr("x", (d, i) => {
        return xScale(i);
      })
      .attr("y", 0)
      .attr("width", subBandWidth)
      .attr("height", height)
      .attr("fill", "#4db6ac")
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')
      .attr('data', (d:any) => {
        return JSON.stringify(d);
      })
      .on("mouseover", function (d: any) {
        d3.select(this).classed("hover", true);
        const data: any = JSON.parse(d3.select(this).attr('data'));

        const text1 = data['start_freq'];
        const text2 = data['end_freq'];

        const index = data.subband;
        const x = xScale(data.subband - 1);
        const sub_band_text = d3.select('#sub_band_text')
          .text(text1 + ' - ' + text2 + ' GHz');
        const textLength = (d3.select('#sub_band_text').node() as SVGTextContentElement)
                            .getComputedTextLength();

        const b = data.band - 1;
        sub_band_text.attr("transform", "translate(" + b * (bandWidth + gap_between_bands) + ")");
        if (x > textLength / 2 && x < (bandWidth - textLength)) {
          sub_band_text.style("text-anchor", "middle")
            .attr("x", xScale(index));
        } else if (x < textLength / 2) {
          sub_band_text.style("text-anchor", "start")
            .attr("x", x);
        } else {
          sub_band_text.style("text-anchor", "end")
            .attr("x", xScale(index));
        }
      })
      .on("mouseout", function () {
        d3.select(this).classed("hover", false);
        d3.select('#sub_band_text').text('');
      })
      .on("click", function () {
        d3.select(this).classed("hover", true);
        const data: any = JSON.parse(d3.select(this).attr('data'));

        const matchingConfigs = props.subBandConfigs.filter((config) => {
          return (data.band === config.band && data.subband === config.subband);
        });

        if (matchingConfigs.length <4) {
          const newConfigs = [...props.subBandConfigs];
          const config = {
            band: data['band'],
            subband: data['subband'],
            data_rate: 0,
            center_freq: 0,
            zoom:''
          };
          newConfigs.push(config);
          props.setSubBandConfigs(newConfigs);
        } else {
          setOpenSnack(true);
        }
      });

    // draw zoom/spectral lines
    const subBandCounts = new Map<string, number>();
    for (const config of props.subBandConfigs) {
      const band = config['band'];
      const subband = config['subband'];

      const key = JSON.stringify({ band: band, subband: subband });
      let count = subBandCounts.get(key) || 0;
      subBandCounts.set(key, ++count);
    }

    svg.append("g").selectAll("g")
      .data(subBandCounts)
      .enter().append("g")
      .attr("transform", function (d: any) {
        const config = JSON.parse(d[0]);
        const band = config['band'];
        const subband = config['subband'];
        const x = (band - 1) * (bandWidth + gap_between_bands)
          + xScale(subband - 1);
        return "translate(" + x + ")";
      })
      .selectAll("line")
      .data(function (d: any) {
        return Array(d[1]).fill(0);
      })
      .enter().append("line")
      .style("stroke-width", 2)
      .style("stroke", ATCAConstants.COLOR_LIST[0])
      .attr("x1", (d, i) => {
        return zoomScale(i + 1);
      })
      .attr("x2", (d, i) => {
        return zoomScale(i + 1);
      })
      .attr("y1", 2)
      .attr("y2", height - 3);


    // draw bands
    const bands = d3.range(1, num_of_if + 1);
    svg.append("g").selectAll("line")
      .data(bands)
      .enter()
      .append("line")
      .style("stroke", (d, i) => {
        return ATCAConstants.COLOR_LIST[d];
      })
      .style("stroke-width", 5)
      .style('opacity', 0.8)
      .attr("x1", (d, i) => {
        return (bandWidth + gap_between_bands)*i;
      })
      .attr("x2", (d, i) => {
        return (bandWidth + gap_between_bands) * i + bandWidth;
      })
      .attr("y1", height - 3)
      .attr("y2", height - 3);
  }

  return (
    <React.Fragment>
      <Snackbar
        open={openSnack}
        autoHideDuration={5000}
        onClose={e => { setOpenSnack(false) }}
        message="Can't ahve more than 4 configurations per sub band!"
      />
      
      <svg width='100%' height='130px' ref={svgRef}>
      </svg>
    </React.Fragment>
  );
};