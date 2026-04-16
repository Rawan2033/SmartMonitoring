import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { HistoricalSummaryPoint } from "../../types";

type HistoricalSummaryChartProps = {
  data: HistoricalSummaryPoint[];
};

export default function HistoricalSummaryChart({ data }: HistoricalSummaryChartProps): JSX.Element {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const width = 620;
    const height = 240;
    const margin = { top: 20, right: 46, bottom: 34, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.18);

    const yLeft = d3.scaleLinear().domain([0, 100]).nice().range([height - margin.bottom, margin.top]);
    const yRight = d3
      .scaleLinear()
      .domain([0, Math.max(1, d3.max(data, (d) => d.cleaningActiveCount) ?? 1)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % Math.ceil(data.length / 8) === 0)));

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yLeft).ticks(5));
    svg.append("g").attr("transform", `translate(${width - margin.right},0)`).call(d3.axisRight(yRight).ticks(4));

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("y", yRight(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("rx", 4)
      .attr("fill", "#b7f0d2")
      .transition()
      .duration(500)
      .attr("y", (d) => yRight(d.cleaningActiveCount))
      .attr("height", (d) => yRight(0) - yRight(d.cleaningActiveCount));

    const lineDust = d3
      .line<HistoricalSummaryPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => yLeft(d.avgDustPercent))
      .curve(d3.curveMonotoneX);

    const lineHumidity = d3
      .line<HistoricalSummaryPoint>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => yLeft(d.avgHumidityPercent))
      .curve(d3.curveMonotoneX);

    const dustPath = svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#8f52ff")
      .attr("stroke-width", 2.3)
      .attr("d", lineDust);

    const humidityPath = svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#2f6fed")
      .attr("stroke-width", 2.3)
      .attr("d", lineHumidity);

    for (const path of [dustPath, humidityPath]) {
      const length = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${length} ${length}`)
        .attr("stroke-dashoffset", length)
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
    }

    const focus = svg.append("g").style("display", "none");
    const dustDot = focus.append("circle").attr("r", 4.5).attr("fill", "#8f52ff").attr("stroke", "#fff").attr("stroke-width", 1.2);
    const humidityDot = focus.append("circle").attr("r", 4.5).attr("fill", "#2f6fed").attr("stroke", "#fff").attr("stroke-width", 1.2);
    const barDot = focus.append("circle").attr("r", 4.5).attr("fill", "#33ad7b").attr("stroke", "#fff").attr("stroke-width", 1.2);

    const tooltip = focus.append("g");
    const tooltipBg = tooltip
      .append("rect")
      .attr("x", 10)
      .attr("y", -54)
      .attr("width", 210)
      .attr("height", 50)
      .attr("rx", 6)
      .attr("fill", "#0f172a")
      .attr("opacity", 0.9);
    const tooltipLine1 = tooltip.append("text").attr("x", 16).attr("y", -38).attr("fill", "#fff").attr("font-size", 11);
    const tooltipLine2 = tooltip.append("text").attr("x", 16).attr("y", -24).attr("fill", "#fff").attr("font-size", 11);
    const tooltipLine3 = tooltip.append("text").attr("x", 16).attr("y", -10).attr("fill", "#fff").attr("font-size", 11);

    const points = data.map((d) => ({
      x: (x(d.label) ?? 0) + x.bandwidth() / 2,
      yDust: yLeft(d.avgDustPercent),
      yHumidity: yLeft(d.avgHumidityPercent),
      yBar: yRight(d.cleaningActiveCount),
      label: d.label,
      dust: d.avgDustPercent,
      humidity: d.avgHumidityPercent,
      cleaning: d.cleaningActiveCount,
    }));

    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .on("mouseenter", () => {
        focus.style("display", null);
      })
      .on("mouseleave", () => {
        focus.style("display", "none");
      })
      .on("mousemove", function (event: MouseEvent) {
        const [mx] = d3.pointer(event, this);
        const nearest = points.reduce((prev, curr) =>
          Math.abs(curr.x - mx) < Math.abs(prev.x - mx) ? curr : prev
        );

        dustDot.attr("cx", nearest.x).attr("cy", nearest.yDust);
        humidityDot.attr("cx", nearest.x).attr("cy", nearest.yHumidity);
        barDot.attr("cx", nearest.x).attr("cy", nearest.yBar);

        tooltip.attr("transform", `translate(${nearest.x},${nearest.yHumidity})`);
        tooltipLine1.text(`${nearest.label}`);
        tooltipLine2.text(`Dust: ${nearest.dust.toFixed(1)}% | Humidity: ${nearest.humidity.toFixed(1)}%`);
        tooltipLine3.text(`Cleaning Active Count: ${nearest.cleaning}`);

        const maxW = Math.max(
          (tooltipLine1.node() as SVGTextElement).getComputedTextLength(),
          (tooltipLine2.node() as SVGTextElement).getComputedTextLength(),
          (tooltipLine3.node() as SVGTextElement).getComputedTextLength()
        );
        tooltipBg.attr("width", Math.max(210, maxW + 18));
      });
  }, [data]);

  return (
    <div>
      <div className="summary-legend">
        <span><i className="dot-legend dust" /> Avg Dust (%)</span>
        <span><i className="dot-legend humidity" /> Avg Humidity (%)</span>
        <span><i className="dot-legend cleaning" /> Cleaning Active Count</span>
      </div>
      <svg ref={ref} width="100%" viewBox="0 0 620 240" role="img" aria-label="Historical summary trend chart" />
    </div>
  );
}
