'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Node { id: string; title: string; type: string }
interface Link { source: string; target: string }
interface GraphData { nodes: Node[]; links: Link[] }

const typeColor: Record<string, string> = {
  project:  '#f59e0b',
  person:   '#60a5fa',
  topic:    '#34d399',
  decision: '#a78bfa',
  meta:     'rgba(255,255,255,0.25)',
  page:     'rgba(255,255,255,0.25)',
}

export default function WikiGraph({ data, onSelect }: { data: GraphData; onSelect: (slug: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return
    const el = svgRef.current
    const W = el.clientWidth || 800
    const H = el.clientHeight || 500

    d3.select(el).selectAll('*').remove()

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H)

    const g = svg.append('g')

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (e) => g.attr('transform', e.transform))
    )

    const nodes: (Node & d3.SimulationNodeDatum)[] = data.nodes.map(n => ({ ...n }))
    const nodeById = new Map(nodes.map(n => [n.id, n]))

    const links = data.links
      .filter(l => nodeById.has(l.source) && nodeById.has(l.target))
      .map(l => ({ source: nodeById.get(l.source)!, target: nodeById.get(l.target)! }))

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(40))

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1.5)

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, Node & d3.SimulationNodeDatum>()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click', (_e, d) => onSelect(d.id))

    node.append('circle')
      .attr('r', d => d.type === 'meta' ? 8 : 14)
      .attr('fill', d => typeColor[d.type] || typeColor.page)
      .attr('fill-opacity', 0.85)
      .attr('stroke', 'rgba(255,255,255,0.15)')
      .attr('stroke-width', 1)

    node.append('text')
      .text(d => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', 26)
      .attr('font-size', '10px')
      .attr('fill', 'rgba(255,255,255,0.6)')
      .style('pointer-events', 'none')

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node & d3.SimulationNodeDatum).x!)
        .attr('y1', d => (d.source as Node & d3.SimulationNodeDatum).y!)
        .attr('x2', d => (d.target as Node & d3.SimulationNodeDatum).x!)
        .attr('y2', d => (d.target as Node & d3.SimulationNodeDatum).y!)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => { sim.stop() }
  }, [data, onSelect])

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
}
