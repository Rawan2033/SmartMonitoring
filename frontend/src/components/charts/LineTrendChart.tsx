import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import type { TrendPoint } from "../../types";

type LineTrendChartProps = {
  data: TrendPoint[];
};

export default function LineTrendChart({ data }: LineTrendChartProps): JSX.Element {
  const ref = useRef<SVGSVGElement | null>(null);

  const series = useMemo(
    () => [
      { key: "dustPercent" as const, color: "#8f52ff", label: "Dust (%)" },
      { key: "humidityPercent" as const, color: "#2f6fed", label: "Humidity (%)" },
      { key: "temperatureC" as const, color: "#ff7b20", label: "Temperature (C)" }
    ],
    []
  );

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const width = 460;
    const height = 260;
    const margin = { top: 20, right: 16, bottom: 32, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear().domain([0, 65]).nice().range([height - margin.bottom, margin.top]);

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

    for (const s of series) {
      const line = d3
        .line<TrendPoint>()
        .x((d) => x(new Date(d.timestamp)))
        .y((d) => y(d[s.key]))
        .curve(d3.curveMonotoneX);

      const path = svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 2.5)
        .attr("d", line);

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
    const dots = series.map((s) =>
      focus.append("circle").attr("r", 4).attr("fill", s.color).attr("stroke", "#fff").attr("stroke-width", 1.2)
    );

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

    const line1 = tooltip.append("text").attr("x", 16).attr("y", -38).attr("fill", "#fff").attr("font-size", 11);
    const line2 = tooltip.append("text").attr("x", 16).attr("y", -24).attr("fill", "#fff").attr("font-size", 11);
    const line3 = tooltip.append("text").attr("x", 16).attr("y", -10).attr("fill", "#fff").attr("font-size", 11);

    const points = data.map((d) => ({
      x: x(new Date(d.timestamp)),
      dust: d.dustPercent,
      humidity: d.humidityPercent,
      temp: d.temperatureC,
      label: d3.timeFormat("%I:%M %p")(new Date(d.timestamp)),
    }));

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

        dots[0].attr("cx", nearest.x).attr("cy", y(nearest.dust));
        dots[1].attr("cx", nearest.x).attr("cy", y(nearest.humidity));
        dots[2].attr("cx", nearest.x).attr("cy", y(nearest.temp));

        tooltip.attr("transform", `translate(${nearest.x},${y(nearest.humidity)})`);
        line1.text(nearest.label);
        line2.text(`Dust: ${nearest.dust.toFixed(1)}% | Humidity: ${nearest.humidity.toFixed(1)}%`);
        line3.text(`Temperature: ${nearest.temp.toFixed(1)}C`);

        const maxW = Math.max(
          (line1.node() as SVGTextElement).getComputedTextLength(),
          (line2.node() as SVGTextElement).getComputedTextLength(),
          (line3.node() as SVGTextElement).getComputedTextLength()
        );
        tooltipBg.attr("width", Math.max(210, maxW + 18));
      });
  }, [data, series]);

  return <svg ref={ref} width="100%" viewBox="0 0 460 260" role="img" aria-label="Sensor trend chart" />;
}
