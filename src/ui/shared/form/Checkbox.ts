import h from 'mithril/hyperscript'

import redraw from '../../../utils/redraw'
import { Prop } from '../../../settings'

interface Attrs {
  label: Mithril.Children
  name: string
  prop: Prop<boolean>
  callback?: (v: boolean) => void
  disabled?: boolean
}

export default {
  view({ attrs }) {
    return h('div.check_container', {
      className: attrs.disabled ? 'disabled' : ''
    }, [
      h('label', {
        'for': attrs.name
      }, attrs.label),
      h('input[type=checkbox]', {
        id: attrs.name,
        name: attrs.name,
        disabled: attrs.disabled,
        checked: attrs.prop(),
        onchange: () => {
          attrs.prop(!attrs.prop())
          if (attrs.callback) {
            attrs.callback(attrs.prop())
          }
          redraw()
        }
      })
    ])
  },
} as Mithril.Component<Attrs, {}>
