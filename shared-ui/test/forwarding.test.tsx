import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusDot from '../components/StatusDot'

/**
 * Every component forwards what it does not recognise to its root element.
 *
 * This is pinned because its absence is invisible: a `data-*` attribute passed
 * to a component that drops it produces no error, no warning and no type
 * complaint — TypeScript does not check hyphenated JSX attributes against a
 * component's props at all. It simply does not appear in the DOM, and whatever
 * depended on it fails somewhere else entirely.
 *
 * NavBar is not here: it calls `usePathname` and renders `next/link`, so it
 * needs a Next.js request context that a plain render has no way to provide.
 * Its forwarding is the same three lines as the others.
 */

const CASES: { name: string; render: (props: Record<string, unknown>) => React.ReactElement }[] = [
  { name: 'Badge', render: props => <Badge {...props}>x</Badge> },
  { name: 'Button', render: props => <Button {...props}>x</Button> },
  { name: 'Card', render: props => <Card {...props}>x</Card> },
  { name: 'EmptyState', render: props => <EmptyState title="x" {...props} /> },
  { name: 'PageHeader', render: props => <PageHeader title="x" {...props} /> },
  { name: 'StatusDot', render: props => <StatusDot {...props} /> },
]

describe('rest props reach the DOM', () => {
  for (const { name, render } of CASES) {
    it(`${name} forwards data-*, id and aria-*`, () => {
      const html = renderToStaticMarkup(
        render({ 'data-testid': 'hook', id: 'the-id', 'aria-label': 'label' })
      )
      expect(html).toContain('data-testid="hook"')
      expect(html).toContain('id="the-id"')
      expect(html).toContain('aria-label="label"')
    })

    it(`${name} still applies its own styling`, () => {
      // The component computes className and style itself, and forwarding must
      // not have taken that over.
      const html = renderToStaticMarkup(render({ 'data-testid': 'hook' }))
      expect(html).toMatch(/class="[^"]+"/)
      expect(html).toMatch(/style="[^"]+"/)
    })

    it(`${name} still merges a caller's className`, () => {
      const html = renderToStaticMarkup(render({ className: 'caller-class' }))
      expect(html).toContain('caller-class')
    })
  }
})

describe('the props each component owns', () => {
  it('Badge keeps `dot` for itself rather than emitting it', () => {
    const html = renderToStaticMarkup(<Badge dot>x</Badge>)
    expect(html).not.toContain('dot=')
  })

  it('Card keeps `padding`, `alt`, `ghost` and `highlight` for itself', () => {
    const html = renderToStaticMarkup(
      <Card padding="p-2" alt ghost highlight>
        x
      </Card>
    )
    for (const own of ['padding=', 'alt=', 'ghost=', 'highlight=']) {
      expect(html).not.toContain(own)
    }
    expect(html).toContain('p-2')
  })

  it('StatusDot keeps its own narrower `color`', () => {
    const html = renderToStaticMarkup(<StatusDot color="amber" />)
    expect(html).not.toContain('color="amber"')
    expect(html).toContain('#f59e0b')
  })

  it('PageHeader renders `title` as a heading rather than an attribute', () => {
    const html = renderToStaticMarkup(<PageHeader title="Documents" />)
    expect(html).toContain('>Documents<')
    expect(html).not.toContain('title="Documents"')
  })
})
