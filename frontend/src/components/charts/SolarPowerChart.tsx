import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { TrendPoint } from "../../types";

type SolarPowerChartProps = {
  data: TrendPoint[];
};

export default function SolarPowerChart({ data }: SolarPowerChartProps): JSX.Element {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const width = 460;
    const height = 260;
    const margin = { top: 18, right: 16, bottom: 32, left: 48 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const maxPower = Math.max(100, d3.max(data, (d) => d.solarPowerMw) ?? 100);
    const y = d3.scaleLinear().domain([0, maxPower]).nice().range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((v) => d3.timeFormat("%I:%M %p")(new Date(v as Date)))
      )
      .call((g) => g.select(".domain").attr("stroke", "#a3acbe"));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call((g) => g.select(".domain").attr("stroke", "#a3acbe"));

    const area = d3
      .area<TrendPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y0(y(0))
      .y1((d) => y(d.solarPowerMw))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<TrendPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y((d) => y(d.solarPowerMw))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "url(#solar-gradient)")
      .attr("d", area);

    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "solar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffd36a").attr("stop-opacity", 0.72);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffd36a").attr("stop-opacity", 0.08);

    const path = svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#f39c12")
      .attr("stroke-width", 2.8)
      .attr("d", line);

    const length = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", `${length} ${length}`)
      .attr("stroke-dashoffset", length)
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    const focus = svg.append("g").style("display", "none");
    const dot = focus.append("circle").attr("r", 4.5).attr("fill", "#f39c12").attr("stroke", "#fff").attr("stroke-width", 1.2);

    const tooltip = focus.append("g");
    const tooltipBg = tooltip
      .append("rect")
      .attr("x", 10)
      .attr("y", -42)
      .attr("width", 170)
      .attr("height", 36)
      .attr("rx", 6)
      .attr("fill", "#0f172a")
      .attr("opacity", 0.9);
    const tooltipLine1 = tooltip.append("text").attr("x", 16).attr("y", -26).attr("fill", "#fff").attr("font-size", 11);
    const tooltipLine2 = tooltip.append("text").attr("x", 16).attr("y", -12).attr("fill", "#fff").attr("font-size", 11);

    const points = data.map((d) => ({
      x: x(new Date(d.timestamp)),
      y: y(d.solarPowerMw),
      power: d.solarPowerMw,
      label: d3.timeFormat("%I:%M %p")(new Date(d.timestamp)),
    }));

    const tooltipPadding = 12;

    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .on("mouseenter", () => focus.style("display", null))
      .on("mouseleave", () => focus.style("display", "none"))
      .on("mousemove", function (event: MouseEvent) {
        const [mx] = d3.pointer(event, this);
        const nearest = points.reduce((prev, curr) =>
          Math.abs(curr.x - mx) < Math.abs(prev.x - mx) ? curr : prev
        );

        dot.attr("cx", nearest.x).attr("cy", nearest.y);
        tooltip.attr("transform", `translate(${nearest.x},${nearest.y})`);
        tooltipLine1.text(nearest.label);
        tooltipLine2.text(`Solar power: ${nearest.power.toFixed(1)} mW`);

        const tooltipWidth = Math.max(
          (tooltipLine1.node() as SVGTextElement).getComputedTextLength(),
          (tooltipLine2.node() as SVGTextElement).getComputedTextLength()
        );
        const resolvedWidth = Math.max(170, tooltipWidth + 18);
        const showLeft = nearest.x + 10 + resolvedWidth > width - margin.right;
        const boxX = showLeft ? -(resolvedWidth + tooltipPadding) : tooltipPadding;
        const textX = boxX + 6;

        tooltip.attr("transform", `translate(${nearest.x},${nearest.y})`);
        tooltipBg.attr("x", boxX).attr("width", resolvedWidth);
        tooltipLine1.attr("x", textX).text(nearest.label);
        tooltipLine2.attr("x", textX).text(`Solar power: ${nearest.power.toFixed(1)} mW`);
      });
  }, [data]);

  return <svg ref={ref} width="100%" viewBox="0 0 460 260" role="img" aria-label="Solar power output chart" />;
}
