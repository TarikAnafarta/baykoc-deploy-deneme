import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function GraphVisualizer({ nodes = [], links = [], colors = {} }) {
  const containerRef = useRef(null);
  const {
    graphLink = '#2b3147',
    graphNode = '#90a4ae',
    graphNodeStroke = '#0f111a',
    graphLabel = '#c7d0e0',
    tooltipBg = 'rgba(15, 23, 42, 0.95)',
    tooltipText = '#e5e7eb',
    tooltipBorder = 'rgba(148, 163, 184, 0.6)',
  } = colors;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();
    const hasData = nodes.length > 0 || links.length > 0;
    if (!hasData) return;

    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 600;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const zoomLayer = svg.append('g');
    const linkLayer = zoomLayer.append('g').attr('stroke', graphLink).attr('stroke-opacity', 0.5);
    const nodeLayer = zoomLayer.append('g');
    const labelLayer = zoomLayer.append('g');

    container.querySelectorAll('.graph-tooltip').forEach((el) => el.remove());
    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('padding', '4px 8px')
      .style('border-radius', '4px')
      .style('font-size', '11px')
      .style('background', tooltipBg)
      .style('color', tooltipText)
      .style('border', `1px solid ${tooltipBorder}`)
      .style('white-space', 'nowrap')
      .style('z-index', '50')
      .style('opacity', 0);

    const linkSelection = linkLayer
      .selectAll('line')
      .data(links, (d, index) => d.id ?? `${d.source}-${d.target}-${index}`)
      .join('line')
      .attr('stroke-width', 1);

    const nodeSelection = nodeLayer
      .selectAll('circle')
      .data(nodes, (d) => d.id ?? `${d.type}-${d.label}`)
      .join('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => d.color || graphNode)
      .attr('stroke', graphNodeStroke)
      .attr('stroke-width', 1.2)
      .on('mouseover', function (event, d) {
        const label = d.label || d.name || '';
        const rawSuccess =
          d.basari_puani ??
          d.basari ??
          d.kazanim_basarisi ??
          d.success ??
          d.score ??
          d.puan ??
          d.value ??
          0;
        const num = Number(rawSuccess);
        let text = label || 'Node';
        if (!Number.isNaN(num)) {
          const success = Math.round(num * 100) / 100;
          text += ` – Başarı: ${success}`;
        }
        tooltip
          .style('opacity', 1)
          .html(text)
          .style('left', event.offsetX + 12 + 'px')
          .style('top', event.offsetY + 12 + 'px');
      })
      .on('mousemove', function (event) {
        tooltip.style('left', event.offsetX + 12 + 'px').style('top', event.offsetY + 12 + 'px');
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0);
      });

    const labelNodes = nodes.filter((node) => ['konu', 'grup', 'alt_grup'].includes(node.type));
    const labelSelection = labelLayer
      .selectAll('text')
      .data(labelNodes, (d) => d.id ?? `${d.type}-${d.label}`)
      .join('text')
      .text((d) => d.label || '')
      .attr('font-size', (d) => Math.max(12, d.r * 0.52))
      .attr('fill', graphLabel)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.r + 14);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((link) => {
            const s = link.source;
            const t = link.target;
            const radiusSum = (s.r || 14) + (t.r || 14);
            let distance = 30 + radiusSum * 0.9;
            if (s.type === 'konu' || t.type === 'konu') distance += 60;
            if (t.type === 'kazanım') distance += 5;
            return distance;
          })
          .strength(0.12),
      )
      .force('charge', d3.forceManyBody().strength(-1600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.03))
      .force('y', d3.forceY(height / 2).strength(0.03))
      .force(
        'collide',
        d3
          .forceCollide()
          .radius((d) => d.r + 4)
          .iterations(2),
      );

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      nodeSelection.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      labelSelection.attr('x', (d) => d.x).attr('y', (d) => d.y);
    });

    const zoom = d3
      .zoom()
      .scaleExtent([0.05, 4])
      .on('zoom', (event) => zoomLayer.attr('transform', event.transform));
    svg.call(zoom);

    function fitToView(padding = 60) {
      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs) - padding;
      const maxX = Math.max(...xs) + padding;
      const minY = Math.min(...ys) - padding;
      const maxY = Math.max(...ys) + padding;
      const widthSpan = maxX - minX;
      const heightSpan = maxY - minY;
      if (!(isFinite(widthSpan) && isFinite(heightSpan) && widthSpan > 0 && heightSpan > 0)) return;
      const scale = Math.min(width / widthSpan, height / heightSpan, 1) * 0.9;
      const tx = (width - widthSpan * scale) / 2 - minX * scale;
      const ty = (height - heightSpan * scale) / 2 - minY * scale;
      svg
        .transition()
        .duration(700)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    const viewTimer = setTimeout(() => fitToView(), 1200);

    return () => {
      clearTimeout(viewTimer);
      simulation.stop();
      tooltip.remove();
      svg.remove();
    };
  }, [
    nodes,
    links,
    graphLink,
    graphNode,
    graphNodeStroke,
    graphLabel,
    tooltipBg,
    tooltipBorder,
    tooltipText,
  ]);

  return <div ref={containerRef} className="w-full h-full" />;
}
