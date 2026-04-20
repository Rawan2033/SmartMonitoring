import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { TriggerEvent } from "../../types";

type BarEventsChartProps = {
  data: TriggerEvent[];
};

export default function BarEventsChart({ data }: BarEventsChartProps): JSX.Element {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const width = 460;
    const height = 260;
    const margin = { top: 20, right: 16, bottom: 32, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.timestamp))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, Math.max(4, d3.max(data, (d) => d.count) ?? 4)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const tickStep = Math.max(1, Math.ceil(data.length / 6));
    const tickValues = x.domain().filter((_, i) => i % tickStep === 0);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickValues)
          .tickFormat((v) => d3.timeFormat("%-I %p")(new Date(v as string)))
      )
      .call((g) => g.selectAll("text").style("font-size", "11px"));

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(4));

    const bars = svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.timestamp) ?? 0)
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("rx", 4)
      .attr("fill", "#16b685");

    bars
      .transition()
      .duration(550)
      .ease(d3.easeCubicOut)
      .delay((_, i) => i * 20)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => y(0) - y(d.count));

    const tooltip = svg.append("g").style("display", "none");
    const tooltipBg = tooltip
      .append("rect")
      .attr("x", 8)
      .attr("y", -30)
      .attr("width", 170)
      .attr("height", 24)
      .attr("rx", 6)
      .attr("fill", "#0f172a")
      .attr("opacity", 0.9);
    const tooltipText = tooltip
      .append("text")
      .attr("x", 14)
      .attr("y", -14)
      .attr("fill", "#fff")
      .attr("font-size", 11)
      .attr("font-weight", 600);

    const tooltipPadding = 12;

    bars
      .on("mouseenter", () => tooltip.style("display", null))
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#16b685");
        tooltip.style("display", "none");
      })
      .on("mousemove", function (event: MouseEvent, d: TriggerEvent) {
        const barX = (x(d.timestamp) ?? 0) + x.bandwidth() / 2;
        const barY = y(d.count);
        const label = d3.timeFormat("%I:%M %p")(new Date(d.timestamp));

        d3.select(this).attr("fill", "#129f74");
        tooltipText.text(`${label} | Events: ${d.count}`);
        const textWidth = (tooltipText.node() as SVGTextElement).getComputedTextLength();
        const resolvedWidth = Math.max(170, textWidth + 16);
        const showLeft = barX + 8 + resolvedWidth > width - margin.right;
        const boxX = showLeft ? -(resolvedWidth + tooltipPadding) : tooltipPadding;
        const textX = boxX + 6;

        tooltip.attr("transform", `translate(${barX},${barY})`);
        tooltipBg.attr("x", boxX).attr("width", resolvedWidth);
        tooltipText.attr("x", textX).text(`${label} | Events: ${d.count}`);
      });
  }, [data]);

  return <svg ref={ref} width="100%" viewBox="0 0 460 260" role="img" aria-label="Triggered events chart" />;
}
