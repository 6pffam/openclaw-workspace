'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import * as d3 from 'd3'
import { getInitials, getTierColor } from '@/lib/utils'
import type { GraphNode, GraphLink } from '@/lib/connections'

interface ForceGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick?: (node: GraphNode) => void
  onLinkClick?: (link: GraphLink) => void
  selectedNodeId?: string | null
}

interface SimNode extends GraphNode, d3.SimulationNodeDatum {
  x: number
  y: number
  fx?: number | null
  fy?: number | null
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string
  isDirectional: boolean
  primaryColor: string
  categoryNames: string[]
}

const NODE_RADIUS = 22
const RING_GAP = 4

export default function ForceGraph({
  nodes,
  links,
  onNodeClick,
  onLinkClick,
  selectedNodeId,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  const render = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    if (!container || !svgRef.current) return

    const width = container.clientWidth
    const height = container.clientHeight

    svg.attr('width', width).attr('height', height)
    svg.selectAll('*').remove()

    if (!nodes.length) return

    // Defs for arrow markers
    const defs = svg.append('defs')
    const arrowId = 'arrow'
    defs.append('marker')
      .attr('id', arrowId)
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', NODE_RADIUS + 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.3)')

    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    if (svgRef.current) {
      d3.select<SVGSVGElement, unknown>(svgRef.current).call(zoom)
    }

    // Prepare sim data
    const simNodes: SimNode[] = nodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }))

    const nodeMap = new Map(simNodes.map(n => [n.id, n]))

    const simLinks: SimLink[] = links.map(l => ({
      ...l,
      source: nodeMap.get(typeof l.source === 'string' ? l.source : (l.source as SimNode).id) || l.source,
      target: nodeMap.get(typeof l.target === 'string' ? l.target : (l.target as SimNode).id) || l.target,
    }))

    // Simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(120)
        .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(NODE_RADIUS + 20))
    simRef.current = sim

    // Links
    const linkGroup = g.append('g').attr('class', 'links')
    const linkElements = linkGroup.selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => d.primaryColor)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => d.isDirectional ? `url(#${arrowId})` : null)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        onLinkClick?.({ id: d.id, source: (d.source as SimNode).id, target: (d.target as SimNode).id, isDirectional: d.isDirectional, primaryColor: d.primaryColor, categoryNames: d.categoryNames })
      })
      .on('mouseover', (event, d) => {
        const cats = d.categoryNames.join(', ')
        setTooltip({ x: event.clientX, y: event.clientY, content: cats || 'Connection' })
      })
      .on('mouseout', () => setTooltip(null))

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const nodeElements = nodeGroup.selectAll<SVGGElement, SimNode>('g.node')
      .data(simNodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick?.(d)
      })
      .on('mouseover', (event, d) => {
        setTooltip({ x: event.clientX, y: event.clientY, content: d.name })
      })
      .on('mouseout', () => setTooltip(null))

    // Draw each node
    nodeElements.each(function(d) {
      const el = d3.select(this)
      const rings = d.ringColors

      // Concentric rings (outermost first)
      const totalRings = rings.length
      for (let i = totalRings - 1; i >= 0; i--) {
        const ringRadius = NODE_RADIUS + RING_GAP * (i + 1) + 2
        el.append('circle')
          .attr('r', ringRadius)
          .attr('fill', 'none')
          .attr('stroke', rings[i])
          .attr('stroke-width', i === 0 ? 3 : 1.5)
          .attr('stroke-opacity', i === 0 ? 0.9 : 0.5)
      }

      // Tier indicator ring (innermost)
      el.append('circle')
        .attr('r', NODE_RADIUS + 2)
        .attr('fill', 'none')
        .attr('stroke', getTierColor(d.tier))
        .attr('stroke-width', 2)
        .attr('stroke-opacity', d.tier === 'None' ? 0.2 : 0.6)
        .attr('stroke-dasharray', d.tier === 'Inner Circle' ? 'none' : d.tier === 'Active Network' ? 'none' : '4 2')

      // Avatar circle background
      el.append('circle')
        .attr('r', NODE_RADIUS)
        .attr('fill', '#0f2236')
        .attr('stroke', selectedNodeId === d.id ? '#f59e0b' : 'rgba(255,255,255,0.1)')
        .attr('stroke-width', selectedNodeId === d.id ? 3 : 1.5)

      if (d.photoUrl) {
        // Clip path for photo
        const clipId = `clip-${d.id}`
        d3.select(svgRef.current).select('defs')
          .append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('r', NODE_RADIUS)

        el.append('image')
          .attr('href', d.photoUrl)
          .attr('x', -NODE_RADIUS)
          .attr('y', -NODE_RADIUS)
          .attr('width', NODE_RADIUS * 2)
          .attr('height', NODE_RADIUS * 2)
          .attr('clip-path', `url(#${clipId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
      } else {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', 13)
          .attr('font-weight', '600')
          .attr('fill', 'rgba(255,255,255,0.6)')
          .text(getInitials(d.name))
      }

      // Name label below
      el.append('text')
        .attr('y', NODE_RADIUS + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('font-weight', '500')
        .attr('fill', 'rgba(255,255,255,0.75)')
        .text(d.name.split(' ')[0]) // first name only for readability
    })

    // Click on SVG to deselect
    svg.on('click', () => onNodeClick?.(null as unknown as GraphNode))

    // Tick
    sim.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as SimNode).x)
        .attr('y1', d => (d.source as SimNode).y)
        .attr('x2', d => (d.target as SimNode).x)
        .attr('y2', d => (d.target as SimNode).y)

      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [nodes, links, selectedNodeId, onNodeClick, onLinkClick])

  useEffect(() => {
    const cleanup = render()
    return () => {
      cleanup?.()
      simRef.current?.stop()
    }
  }, [render])

  // Re-render on resize
  useEffect(() => {
    const obs = new ResizeObserver(() => render())
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [render])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 8,
          background: 'rgba(26,22,20,0.85)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  )
}
